# Boost V2 — Database Architecture

Source of truth: the live **Supabase Postgres** database. Schema changes are
written as SQL files in `db/migrations/` (see that folder's README for the
workflow) and applied by hand via the Supabase SQL editor. Runtime reads and
writes go through the Supabase JS client.

The `db/migrations/0001_baseline.sql` file is a **reconstructed** baseline —
it was written from application code, not dumped from Postgres. Before
treating it as authoritative, run the introspection queries in
`db/migrations/README.md` against the live DB and reconcile any drift.

Images are stored in **S3** (direct presigned uploads), not Supabase Storage.

---

## 1. High-level

```
auth.users (Supabase-managed)
    │ 1:1
    ▼
public.profiles ──┐
    │             │ (seller)
    │             ▼
    │        public.accounts  ─── public.games
    │             │ 1:1
    │             ▼
    │        public.credentials   (AES-256-GCM ciphertext)
    │
    │ (reviewer) ▼
    ├──── public.offer_reviews ─── public.accounts
    │
    │ (user) ▼
    ├──── public.wishlists      ─── public.accounts
    │
    │ (buyer) ▼
    └──── public.orders         ─── public.accounts
```

Money is stored as **integer cents**. Convert at the boundary
(`Math.round(eur * 100)` in, `cents / 100` out). Cap for selling `price` is
€1000 (100_000 cents); MRP / `old_price` is uncapped but must be `>= price`.

---

## 2. Tables

### `auth.users` (Supabase-managed)

Standard Supabase auth table — we never insert into this directly. We reference
it by `id` (UUID) in `profiles.id`.

Columns we rely on: `id`, `email`. RLS reads use `auth.uid()` to join against
our own tables.

---

### `public.profiles`

One row per auth user. Created by trigger on `auth.users` insert (signup).

| Column        | Type        | Notes                                             |
|---------------|-------------|---------------------------------------------------|
| `id`          | `uuid` PK   | FK → `auth.users.id`                              |
| `name`        | `text`      | Display name                                      |
| `avatar_url`  | `text`      | Public S3 URL (https://…)                         |
| `is_seller`   | `boolean`   | Toggle flipped from `/profile` page               |
| `store_id`    | `int`       | Unique per seller. Auto-assigned on flip via sequence starting at 100 |
| `created_at`  | `timestamptz` | Default `now()`                                 |

Access patterns:
- `src/app/(dashboard)/profile/page.tsx` — read self
- `src/app/api/profile/avatar/route.ts` — update `avatar_url`
- `src/app/api/profile/account-type/route.ts` — toggle `is_seller`
- `src/lib/sellers.ts` — look up by `store_id` for seller pages
- `src/lib/offers.ts` — joined into `accounts` queries as `seller`

---

### `public.games`

Static catalog of games buyers can browse. Seeded manually.

| Column       | Type     | Notes                         |
|--------------|----------|-------------------------------|
| `id`         | `uuid` PK | Default `gen_random_uuid()` |
| `slug`       | `text`   | Unique — used in all URLs     |
| `name`       | `text`   | Display name                  |
| `subtitle`   | `text`   | Short tagline (nullable)      |
| `cover`      | `text`   | Image key or fallback slug    |

Access: `src/lib/offers.ts::listGames`, `findGameBySlug`, and inside server
actions to re-validate that a submitted `game_id` actually exists.

---

### `public.accounts` — the listings table

This is the core marketplace table. One row per game-account listing. Name is
historical ("accounts" the product, not a user account).

| Column            | Type                     | Notes                                                              |
|-------------------|--------------------------|--------------------------------------------------------------------|
| `id`              | `uuid` / `cuid` PK        | Generated server-side                                              |
| `game_id`         | FK → `games.id`           | Required                                                           |
| `seller_id`       | FK → `auth.users.id` (uuid) | Required. Ownership check enforced by RLS **and** by server action before update/delete |
| `title`           | `text`                    | Required                                                           |
| `description`     | `text`                    | Nullable                                                           |
| `price`           | `int`                     | **Cents**. `0 < price ≤ 100_000` (€1000 cap).                     |
| `old_price`       | `int`                     | **Cents**, nullable. When set, must be `>= price`. No upper cap.  |
| `discount_price`  | `int`                     | **Cents**, nullable. Flash-discount price; see below.             |
| `discount_ends_at`| `timestamptz`             | Nullable; when set, pairs with `discount_price` (CHECK constraint).|
| `images`          | `text[]`                  | Array of public S3 URLs. Server filters to `https://` prefix and slices to 10. |
| `status`          | enum-as-text              | `AVAILABLE` \| `RESERVED` \| `SOLD`. Defaults to `AVAILABLE`.       |
| `offer_ends_at`   | `timestamptz`             | Optional countdown deadline (legacy, not exposed in seller forms). |
| `created_at`      | `timestamptz`             | Default `now()`                                                    |

**Flash discounts (`discount_price` + `discount_ends_at`, migration 0005):**
Seller-initiated short-term discount (max 72h). While `discount_ends_at` is
in the future, `src/lib/offers.ts::toAccount` promotes `discount_price` to
the effective selling price and fills `Account.discountEndsAt` so the
BuyBox can render a "Limited offer 24Hrs 21Min 52Secs" countdown. Once the
deadline passes, reads revert to `price` automatically — no cron is needed.
The "discount must be less than price" rule is enforced in the server
action, not by a CHECK, so later edits that lower `price` don't collide
with a running discount. Cannot be stopped or paused — the only way to
cancel a running discount is to delete the listing.

Indexing (live — see `db/migrations/0003_composite_listing_indexes.sql`):
- `idx_accounts_game_status_created`   — `(game_id, status, created_at DESC, id DESC)` — game-detail feed
- `idx_accounts_seller_status_created` — `(seller_id, status, created_at DESC, id DESC)` — seller-page feed
- `idx_accounts_status_created`        — `(status, created_at DESC, id DESC)` — home / recent feed

All three include `id DESC` as a stable tie-breaker for cursor pagination
(`src/lib/offers.ts::ListingCursor`).

Access: every file in `src/app/(dashboard)/sell/...`,
`src/app/(dashboard)/user/currently-selling/...`, `src/lib/offers.ts`.

---

### `public.credentials`

One row per listing. Holds the AES-256-GCM **ciphertext** of the seller's
account credentials. Plaintext never touches the DB.

| Column            | Type        | Notes                                            |
|-------------------|-------------|--------------------------------------------------|
| `id`              | PK          | Generated                                        |
| `account_id`      | FK → `accounts.id` | **Unique** (1:1 with listing)             |
| `seller_id`       | FK → `auth.users.id` (uuid) | Used in RLS policy               |
| `encrypted_data`  | `text`      | JSON ciphertext produced by `src/lib/encryption.ts::encrypt` |
| `created_at`      | `timestamptz` | Default `now()`                                |
| `updated_at`      | `timestamptz` | Default `now()`, updated on upsert            |

Decrypted payload shape (`AccountCredentials` in `src/lib/credentials.ts`):
```ts
{ login?: string; password?: string; email?: string; emailPassword?: string; notes?: string }
```

On delete, the row should cascade with the listing (either via FK `onDelete:
Cascade` or by explicit cleanup in the delete action).

Access: `src/lib/credentials.ts` (read, save, delete helpers). **Never** log
or return `encrypted_data` to the browser.

---

### `public.offer_reviews`

Buyer reviews on a specific listing. Currently empty but wired up in read
queries.

| Column         | Type        | Notes                                              |
|----------------|-------------|----------------------------------------------------|
| `id`           | PK          | Generated                                          |
| `offer_id`     | FK → `accounts.id` | Required                                    |
| `reviewer_id`  | FK → `auth.users.id` (uuid) | Named FK `offer_reviews_reviewer_id_fkey` (explicit join used in code) |
| `rating`       | `int`       | 1–5                                                |
| `body`         | `text`      | Nullable                                           |
| `created_at`   | `timestamptz` | Default `now()`                                  |

Access: `src/lib/offers.ts::fetchOfferReviews`.

---

### `public.wishlists`

Per-user wishlist (many-to-many between `auth.users` and `accounts`). See
`db/migrations/0004_wishlists.sql`.

| Column        | Type          | Notes                                         |
|---------------|---------------|-----------------------------------------------|
| `user_id`     | `uuid` (PK)   | FK → `auth.users.id`, on delete cascade       |
| `account_id`  | `uuid` (PK)   | FK → `accounts.id`, on delete cascade         |
| `created_at`  | `timestamptz` | Default `now()` — used to sort the wishlist page |

Composite primary key `(user_id, account_id)` enforces uniqueness (one
listing can't be wishlisted twice by the same user) and covers the
"is this listing in my wishlist" lookup.

Indexing:
- `idx_wishlists_user_created` on `(user_id, created_at DESC, account_id DESC)`
  — covers the `/wishlist` page feed + cursor pagination tie-break.

RLS: user can only see and mutate their own rows (`user_id = auth.uid()`).

Access: `src/lib/wishlist.ts` (read helpers) and
`src/lib/wishlist-actions.ts` (`toggleWishlist` server action).

---

### `public.orders`

One row per buyer→listing transaction. Created exclusively via the
`place_order` RPC; no client-side INSERT path. See
`db/migrations/0006_orders.sql`.

| Column            | Type          | Notes                                                   |
|-------------------|---------------|---------------------------------------------------------|
| `id`              | `uuid` PK     | Default `gen_random_uuid()`                             |
| `buyer_id`        | `uuid`        | FK → `auth.users.id`, on delete restrict                |
| `seller_id`       | `uuid`        | FK → `auth.users.id`, on delete restrict (denormalized from `accounts.seller_id` so seller-side queries don't need a join) |
| `account_id`      | `uuid`        | FK → `accounts.id`, on delete restrict                  |
| `transaction_id`  | `text` UNIQUE | `txn_<hex>` (RPC-generated). Replaced by Stripe IDs once payment is wired. |
| `price_cents`     | `integer`     | Snapshot of the price actually paid (honors active flash discount at order time). |
| `payment_method`  | `text`        | CHECK ∈ `apple-pay`, `google-pay`, `visa`, `mastercard`, `paypal`. |
| `status`          | `text`        | CHECK ∈ `PENDING`, `PAID`, `DELIVERED`, `REFUNDED`. Default `PAID` for the current stub flow. |
| `created_at`      | `timestamptz` | Default `now()`                                         |

Indexing:
- `idx_orders_buyer_created` on `(buyer_id, created_at DESC)` — covers the
  buyer's order history.
- `idx_orders_seller_created` on `(seller_id, created_at DESC)` — covers the
  seller's sales feed.

RLS:
- `orders_select_buyer`: `buyer_id = auth.uid()`.
- `orders_select_seller`: `seller_id = auth.uid()`.
- No INSERT/UPDATE/DELETE policies — every write goes through `place_order`
  (security definer).
- A companion policy `accounts_select_buyer` on `accounts` lets the buyer
  read the listing they purchased once it flips to SOLD (the default
  `accounts_select_public` would otherwise hide it).

Access: `src/lib/orders.ts` (`getMyOrder`) and `src/lib/orders-actions.ts`
(`placeOrder`).

---

## 3. Enums / status values

Implemented either as a Postgres enum or as a CHECK-constrained text column
(both work for our code, which uses string literals).

- `AccountStatus`: `AVAILABLE` | `RESERVED` | `SOLD`
- `OrderStatus`: `PENDING` | `PAID` | `DELIVERED` | `REFUNDED` (live as a CHECK on `orders.status`).
- `Role` (planned, not yet live): `USER` | `ADMIN`

---

## 4. RPCs (Postgres functions)

### `public.create_listings_bulk(p_game_id uuid, p_listings jsonb)`

Atomic bulk insert used by the CSV upload flow. All rows succeed or none do.

**Input:** `p_game_id` UUID, `p_listings` JSON array. Each element:
```json
{
  "title": "…",
  "description": "…",
  "price": 4020,
  "old_price": 8040,
  "encrypted_credentials": "<ciphertext-or-null>"
}
```

**Behaviour:**
- Inserts a row into `accounts` for each element, using the calling user
  (`auth.uid()`) as `seller_id`.
- If `encrypted_credentials` is non-null, also inserts a matching row into
  `credentials` in the same transaction.
- Returns the array of new `accounts.id` values.

**Called from:** `src/app/(dashboard)/sell/bulk-actions.ts`.

If you see `Could not find the function public.create_listings_bulk` at
runtime, the function is missing from the database — reapply the SQL in the
Supabase SQL editor.

### `public.place_order(p_account_id uuid, p_payment_method text)`

Atomic checkout: validates the listing is `AVAILABLE`, snapshots the
effective price (honoring an active flash discount), inserts an `orders`
row as `PAID`, and flips `accounts.status` to `SOLD` so a second buyer
can't reach the same row. Generates `transaction_id` server-side as
`txn_<hex>` via `gen_random_bytes`.

**Input:** `p_account_id` UUID, `p_payment_method` text (one of the five
allowed payment slugs).

**Returns:** single-row table `(order_id uuid, transaction_id text)`.

**Errors raised:** `Not authenticated`, `Invalid payment method`,
`Listing not found`, `Listing is not available`, `Cannot buy your own
listing`. The server action surfaces these strings as-is.

**Called from:** `src/lib/orders-actions.ts::placeOrder`.

---

## 5. Sequences & triggers

- **`store_id` sequence:** starts at `100`. A trigger on `profiles` assigns
  the next value when `is_seller` is first set to `true` (or at row insert,
  depending on current trigger wiring). The effect: every seller has a stable
  human-friendly ID ≥ 100 used in seller URLs (`/seller/[storeId]`).
- **`auth.users` → `profiles` trigger:** creates a `profiles` row on new user
  signup so every auth user has a profile without a separate roundtrip.

---

## 6. Row-Level Security (RLS)

RLS is **ON** on every `public.*` table. The server uses the SSR Supabase
client (`src/lib/supabase/server.ts`) which carries the authenticated user's
JWT, so all writes and reads are evaluated against that identity.

Policy intent (verify against live policies when changing schema):

- `profiles` — readable to anyone; writable only to the owning user
  (`id = auth.uid()`).
- `games` — readable to anyone; writes admin-only.
- `accounts` — readable when `status = 'AVAILABLE'` to anyone; rows are also
  readable to the owning seller regardless of status. Insert/update/delete
  only when `seller_id = auth.uid()`.
- `credentials` — readable **only** to `seller_id = auth.uid()`. Never to
  buyers from the client — credential delivery to the buyer flows through a
  server action after purchase (not yet implemented).
- `offer_reviews` — readable to anyone; writable when
  `reviewer_id = auth.uid()`.

Server actions also add explicit ownership checks on top of RLS (e.g.
`existing.seller_id !== user.id`) so the user gets a meaningful error rather
than a generic RLS failure.

---

## 7. Storage

Images (avatars + listing screenshots) are **S3**, not Supabase Storage.

- Presigned PUT URLs issued by Next.js API routes under
  `src/app/api/uploads/...`.
- Browser uploads directly to S3; resulting public URL (always `https://…`) is
  submitted with the form and persisted on the row.
- On listing delete, `src/lib/s3.ts` uses `DeleteObjectsCommand` to remove the
  associated objects.

Supabase Storage is **not** used.

---

## 8. Encryption

- Algorithm: **AES-256-GCM** (`node:crypto`).
- Key: `CREDENTIALS_ENCRYPTION_KEY` env var — 32-byte key hex-encoded.
  Server-only; never exposed to the client.
- Ciphertext format (see `src/lib/encryption.ts`): `iv.ciphertext.authTag`,
  each segment base64-encoded and joined with `.`.
- The plaintext being encrypted is a **JSON-serialised** `AccountCredentials`
  object, so schema evolution on the credential fields requires no DB change
  — just update the type and the readers/writers.

Rotating the key requires re-encrypting every row (decrypt with old key,
re-encrypt with new). No helper exists for that yet.

---

## 9. Typical query patterns

- **Home feed / category pages** — `accounts` joined with `games` and
  `profiles` via the `ACCOUNT_SELECT` string in `src/lib/offers.ts`.
- **Seller's currently-selling list** — `accounts` filtered by `seller_id`,
  any status, newest first.
- **Listing detail page** — single `accounts` row + joined game + seller +
  `offer_reviews` pull.
- **Creating a listing (single or bulk)** — always re-validates game ID
  server-side, always re-asserts authenticated user, always re-caps price to
  `PRICE_CAP_CENTS`.

---

## 10. Known gaps / TODO

- **Real payment processor** — `place_order` currently inserts orders as
  `PAID` immediately for the stub flow. Stripe Checkout Session creation,
  webhook verification, and the `PENDING → PAID` transition still need to
  be wired. `src/lib/stripe.ts` is scaffolding.
- **Credential delivery flow** — reading credentials as a buyer post-purchase
  is not yet wired; currently only the seller can read their own row.
- **Admin role** — no `role` column on `profiles` yet; admin tooling is
  out-of-band.
- **Migrations** — `db/migrations/` is a plain SQL folder applied by hand.
  Works for solo dev but drifts easily; if the team grows or you want a
  local dev DB, graduate to the Supabase CLI (`supabase init` + `supabase
  db push`).

---

## 11. When in doubt

- Check what the code actually queries (`grep -n "\.from\(" src/`).
- For a missing column / function error at runtime, the fix is almost always
  in the Supabase SQL editor, not in Prisma.
- Before altering a table, search `src/` for every `.from("table_name")` call
  and make sure the change is backward-compatible with the columns those
  queries select.
