# Boost V2 — Database Architecture

Source of truth: the live **Supabase Postgres** database. Schema changes are
written as SQL files in `db/migrations/` (see that folder's README for the
workflow) and applied by hand via the Supabase SQL editor. Runtime reads and
writes go through the Supabase JS client.

`db/migrations/0001_baseline.sql` was originally **reconstructed** from
application code, not dumped from Postgres. Migration
`0014_baseline_reconcile.sql` brings the migration history in line with
what's actually running in prod (real ENUM for `account_status`, the
`offer_reviews.seller_id` column, custom triggers, etc.) — apply it after
0001 on any fresh DB. Future migrations should match prod exactly via
`pg_dump --schema-only` rather than reinventing.

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
| `id`          | `uuid` PK   | FK → `auth.users.id`, on delete cascade           |
| `email`       | `text` UNIQUE NOT NULL | Mirrored from `auth.users.email` by signup trigger. |
| `name`        | `text`      | Display name. Trigger seeds from `raw_user_meta_data->>full_name/name` or email prefix on signup. |
| `avatar_url`  | `text`      | Public S3 URL (https://…). Trigger seeds from `raw_user_meta_data->>boost_avatar_url/avatar_url`. |
| `is_seller`   | `boolean`   | Toggle flipped from `/profile` page               |
| `store_id`    | `int` UNIQUE | Assigned from `store_id_seq` (start 100) by `ensure_store_id()` trigger when `is_seller` first flips true. |
| `created_at`  | `timestamptz` | Default `now()`                                 |
| `updated_at`  | `timestamptz` | Default `now()`. Bumped by `ensure_store_id()` on every insert/update. |

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
| `slug`       | `text` UNIQUE | Used in all URLs (`/games/<slug>`). |
| `name`       | `text`   | Display name                  |
| `subtitle`   | `text`   | Short tagline (nullable)      |
| `cover`      | `text`   | Image key or fallback slug    |
| `created_at` | `timestamptz` | Default `now()`           |

Access: `src/lib/offers.ts::listGames`, `findGameBySlug`, and inside server
actions to re-validate that a submitted `game_id` actually exists.

---

### `public.accounts` — the listings table

This is the core marketplace table. One row per game-account listing. Name is
historical ("accounts" the product, not a user account).

| Column            | Type                     | Notes                                                              |
|-------------------|--------------------------|--------------------------------------------------------------------|
| `id`              | `uuid` PK                 | Default `gen_random_uuid()`                                       |
| `game_id`         | FK → `games.id` ON DELETE RESTRICT | Required                                                  |
| `seller_id`       | FK → `profiles.id` ON DELETE RESTRICT | Required. Ownership enforced by RLS **and** by server action before update/delete. |
| `title`           | `text`                    | Required                                                           |
| `description`     | `text`                    | Nullable                                                           |
| `price`           | `int`                     | **Cents**. CHECK `0 ≤ price ≤ 100_000` (€1000 cap, re-enforced in 0014). |
| `old_price`       | `int`                     | **Cents**, nullable. When set, must be `>= price`. No upper cap.  |
| `discount_price`  | `int`                     | **Cents**, nullable. Flash-discount price; see below.             |
| `discount_ends_at`| `timestamptz`             | Nullable; when set, pairs with `discount_price` (CHECK constraint).|
| `images`          | `text[]`                  | Array of public S3 URLs. Server filters to `https://` prefix and slices to 10. |
| `status`          | `account_status` ENUM     | `AVAILABLE` \| `RESERVED` \| `SOLD`. Real Postgres enum (per 0014). Defaults to `AVAILABLE`. |
| `platform`        | `text`                    | Free-text qualifier (e.g. `PC`, `PS5`). Nullable. Buyer confirms it pre-reveal. |
| `region`          | `text`                    | Free-text qualifier (e.g. `NA`, `EU`). Nullable. Buyer confirms it pre-reveal. |
| `offer_ends_at`   | `timestamptz`             | Optional countdown deadline (legacy, not exposed in seller forms). |
| `created_at`      | `timestamptz`             | Default `now()`                                                    |
| `updated_at`      | `timestamptz`             | Default `now()`. Bumped by `on_accounts_update` trigger via `set_updated_at()`. |

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

On delete: FK `account_id` is `ON DELETE CASCADE`, so credentials drop
when the listing does.

Access:
- `src/lib/credentials.ts` — seller-side read / save / delete helpers
  (RLS gates by `seller_id = auth.uid()`).
- `src/lib/orders-reveal.ts::revealOrderCredentials` — buyer-side
  decryption path. Calls the `reveal_credentials` RPC (security
  definer) which bypasses the seller-only RLS, gated on the caller
  having an order on the listing. Plaintext is decrypted on the Node
  side and returned to the buyer's reveal popup; never touches plpgsql.

**Never** log or return `encrypted_data` (or the decrypted plaintext) in
shared logs / response bodies outside the dialog return value.

---

### `public.offer_reviews`

Buyer reviews on a specific listing. Created exclusively via the
`submit_review` RPC. Updates limited to a 30-day edit window from
creation. See `db/migrations/0013_offer_reviews_constraints.sql`.

| Column         | Type        | Notes                                              |
|----------------|-------------|----------------------------------------------------|
| `id`           | `uuid` PK   | Default `gen_random_uuid()`                        |
| `offer_id`     | FK → `accounts.id` ON DELETE SET NULL | Nullable. If a listing ever gets deleted (gated, but possible), the review survives orphaned. |
| `seller_id`    | FK → `profiles.id` ON DELETE CASCADE NOT NULL | Denormalized from the listing so seller-side queries don't need a join. |
| `reviewer_id`  | FK → `profiles.id` ON DELETE CASCADE NOT NULL | Named FK `offer_reviews_reviewer_id_fkey` (explicit join used in code). |
| `rating`       | `int`       | CHECK `1 ≤ rating ≤ 5`                             |
| `body`         | `text`      | Nullable. CHECK `char_length ≤ 1500`.              |
| `created_at`   | `timestamptz` | Default `now()`                                  |
| `updated_at`   | `timestamptz` | Default `now()`. Bumped by `offer_reviews_touch_updated_at` trigger via `touch_updated_at()`. |

Constraints:
- `offer_reviews_unique_buyer` UNIQUE `(offer_id, reviewer_id)` — one
  review per buyer per listing. Subsequent submits become updates of
  the same row (within the 30-day edit window).

Indexing:
- `idx_reviews_seller_created` on `(seller_id, created_at DESC)` — covers
  the seller profile reviews tab + PDP "recent 5" preview.
- `idx_reviews_offer` on `(offer_id)` — kept for offer-specific reads.

RLS:
- Public read (`reviews are public`).
- `reviewer inserts own review` — INSERT with `reviewer_id = auth.uid()`.
- `offer_reviews_update_own` — UPDATE only by the reviewer.
- `offer_reviews_delete_own` — DELETE only by the reviewer.
- All writes practically flow through `submit_review` (security
  definer), which gates on the caller having an order on the listing
  and enforces the 30-day edit window.

Access:
- `src/lib/reviews.ts` — `getMyReviewForOffer`, `getSellerReviewStats`,
  `getSellerReviewsPage` (server reads).
- `src/lib/reviews-actions.ts` — `submitReview` (server action calling
  the RPC).

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
| `id`              | `uuid` PK     | Default `gen_random_uuid()`. Internal-only — every app-facing surface (URLs, display, cursor pagination) uses `order_number` instead. |
| `buyer_id`        | `uuid`        | FK → `auth.users.id`, on delete restrict                |
| `seller_id`       | `uuid`        | FK → `auth.users.id`, on delete restrict (denormalized from `accounts.seller_id` so seller-side queries don't need a join) |
| `account_id`      | `uuid`        | FK → `accounts.id`, on delete restrict                  |
| `order_number`    | `text` UNIQUE | Public order id, format `o-XXXXXXXX` (8 random digits). Generated by `place_order` with retry-on-collision. App's `Order.id` is aliased from this column via SELECT. |
| `transaction_id`  | `text` UNIQUE | Public payment ref, format `t-XXXXXXXXXXXX` (12 random digits). Will be replaced by Stripe payment-intent ids once payment is wired. |
| `price_cents`     | `integer`     | Snapshot of the price actually paid (honors active flash discount at order time). |
| `payment_method`  | `text`        | CHECK ∈ `apple-pay`, `google-pay`, `visa`, `mastercard`, `paypal`. |
| `status`          | `text`        | CHECK ∈ `PENDING`, `PAID`, `DELIVERED`, `REFUNDED`. Default `PAID` for the current stub flow. |
| `revealed_at`     | `timestamptz` | Nullable; set on first credential reveal. Drives the buyer-detail page button label "Reveal" → "View" after reveal. |
| `marked_received_at` | `timestamptz` | Nullable; set when the buyer confirms receipt via the 4-checkbox stage. Locked once set. |
| `received_checks` | `jsonb`       | Snapshot of the four (or three when no email creds) confirmation flags the buyer ticked: `account_info_works`, `matches_description`, `email_access`, `password_changed`. Audit trail. |
| `protect_plan`    | `text`        | Nullable; CHECK ∈ `'3m'`, `'6m'`. Boost Protect plan attached to the order, or null if the buyer skipped. Per `0015`. |
| `protect_fee_cents` | `integer`   | Default `0`, CHECK `>= 0`. Server-computed fee at order time: `round(price_cents * 0.10)` for `3m`, `round(price_cents * 0.14)` for `6m`. Total charged = `price_cents + protect_fee_cents`. |
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

Access:
- `src/lib/orders.ts` — buyer & seller readers (`getMyOrder`, `getMySale`,
  `getMyPurchases`, `getMySales`, `getMyPurchaseForListing`,
  `getMySaleForListing`).
- `src/lib/orders-actions.ts` — `placeOrder` (calls `place_order` RPC).
- `src/lib/orders-reveal.ts` — `revealOrderCredentials` (calls
  `reveal_credentials` RPC, decrypts on Node side).
- `src/lib/orders-confirm.ts` — `confirmOrderReceived` (calls
  `mark_order_received` RPC).

---

## 3. Enums / status values

- **`account_status`** — real Postgres ENUM (`AVAILABLE` | `RESERVED` |
  `SOLD`) on `accounts.status`. Per `0014`. Cast in policies as
  `'AVAILABLE'::public.account_status`.
- **OrderStatus** — CHECK-constrained text on `orders.status`:
  `PENDING` | `PAID` | `DELIVERED` | `REFUNDED`.
- **Payment method** — CHECK on `orders.payment_method`: `apple-pay` |
  `google-pay` | `visa` | `mastercard` | `paypal`. Mirrored in the
  `place_order` RPC's input validation.
- **`Role`** (planned, not yet live): `USER` | `ADMIN`.

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

### `public.place_order(p_account_id uuid, p_payment_method text, p_protect_plan text DEFAULT NULL)`

Atomic checkout: validates the listing is `AVAILABLE`, snapshots the
effective price (honoring an active flash discount), inserts an `orders`
row as `PAID`, and flips `accounts.status` to `SOLD` so a second buyer
can't reach the same row. Generates the user-facing identifiers
server-side: `order_number` as `o-` + 8 digits, `transaction_id` as
`t-` + 12 digits. Wraps the insert in a retry loop so a (vanishingly
rare) `unique_violation` regenerates and tries again.

**Input:** `p_account_id` UUID, `p_payment_method` text (one of the five
allowed payment slugs), `p_protect_plan` text (optional, one of `'3m'`,
`'6m'`, or null to skip).

**Returns:** single-row table `(order_id text, transaction_id text)`,
where `order_id` is the public `order_number` (used in URLs and UI).

**Boost Protect:** when `p_protect_plan` is set, the RPC computes the fee
server-side from the same effective price used for `price_cents`:
`round(v_price * 0.10)` for `3m`, `round(v_price * 0.14)` for `6m`.
Persisted in `orders.protect_plan` and `orders.protect_fee_cents`. The
client never supplies the fee — only the plan. Mirror constants live in
`src/lib/protect.ts`; both must round identically. Per `0015`.

**Errors raised:** `Not authenticated`, `Invalid payment method`,
`Invalid protect plan`, `Listing not found`, `Listing is not available`,
`Cannot buy your own listing`. The server action surfaces these strings
as-is.

**Called from:** `src/lib/orders-actions.ts::placeOrder`.

### `public.reveal_credentials(p_order_number text)`

Buyer-side credential reveal. Verifies the caller is the buyer of the
order, reads the encrypted ciphertext from `credentials` (bypassing the
seller-only RLS), flips `orders.revealed_at` on first call, and returns
the ciphertext so the Node-side action can decrypt it. Plaintext never
touches plpgsql or the DB layer.

**Input:** `p_order_number` text (the user-facing order id, e.g.
`o-12345678`).

**Returns:** single-row table `(encrypted_data text,
was_already_revealed boolean)`.

**Errors raised:** `Not authenticated`, `Order not found`,
`No credentials available for this listing`.

**Called from:** `src/lib/orders-reveal.ts::revealOrderCredentials`.

### `public.mark_order_received(p_order_number text, p_checks jsonb)`

Buyer's "Mark as received" confirmation. Sets `orders.marked_received_at`
to `now()` and `received_checks` to the JSON snapshot, but only if the
caller is the buyer and the row hasn't already been marked received.
The latter clause makes the operation idempotent / locked — buyers
can't flip the flag back.

**Input:** `p_order_number` text, `p_checks` jsonb (the 4-key snapshot).

**Returns:** void. Raises `Order not found or already marked received`
when the gating WHERE clause matches no rows.

**Called from:** `src/lib/orders-confirm.ts::confirmOrderReceived`.

### `public.submit_review(p_offer_id uuid, p_rating integer, p_body text)`

Buyer review create-or-update. Validates rating ∈ [1..5] and
`char_length(body) ≤ 1500`, gates on the caller having any order on
the listing (verified buyer), denormalizes the seller from
`accounts.seller_id` into `offer_reviews.seller_id`, then either:

- **Inserts** a new review when none exists for `(offer_id, reviewer_id)`.
- **Updates** the existing review's rating + body when it does, **but
  only within 30 days from `created_at`**. Past 30 days, raises
  `Reviews can only be edited within 30 days of creation`.

**Input:** `p_offer_id` UUID, `p_rating` int, `p_body` text (nullable).

**Returns:** `uuid` — the review id.

**Errors raised:** `Not authenticated`, `Rating must be between 1 and 5`,
`Review cannot exceed 1500 characters`, `Listing not found`,
`Only verified buyers can review this listing`,
`Reviews can only be edited within 30 days of creation`.

**Called from:** `src/lib/reviews-actions.ts::submitReview`.

---

## 5. Sequences & triggers

- **`store_id_seq` sequence:** starts at `100`. The
  `on_profiles_changed` trigger calls `ensure_store_id()` BEFORE INSERT
  OR UPDATE, which assigns the next value when `is_seller = true` and
  `store_id is null`. Same trigger also bumps `updated_at`. Every
  seller has a stable human-friendly ID ≥ 100 used in seller URLs
  (`/seller/[storeId]`).
- **`auth.users` → `profiles` trigger** (`on_auth_user_created` AFTER
  INSERT on `auth.users` → `handle_new_user()`): creates a `profiles`
  row on new user signup. Pulls name/avatar from
  `raw_user_meta_data->>full_name` / `name` (fallback: email prefix)
  and `boost_avatar_url` / `avatar_url`. `is_seller` defaults to
  whatever `raw_user_meta_data->>isSeller` says or false.
- **`set_updated_at()`** + `on_accounts_update` trigger BEFORE UPDATE
  on `accounts` — bumps `updated_at` on every row change.
- **`touch_updated_at()`** + `offer_reviews_touch_updated_at` trigger
  BEFORE UPDATE on `offer_reviews` — same purpose, separate function
  for historical reasons (both exist; consolidating is more risk than
  it's worth).

---

## 6. Row-Level Security (RLS)

RLS is **ON** on every `public.*` table. The server uses the SSR Supabase
client (`src/lib/supabase/server.ts`) which carries the authenticated user's
JWT, so all writes and reads are evaluated against that identity.

Policies (post-`0014` reconciliation):

- **`profiles`** — public read; INSERT only when `id = auth.uid()`;
  UPDATE only when `id = auth.uid()`.
- **`games`** — public read. No write policies — writes need the
  service-role key (admin tooling).
- **`accounts`**:
  - `accounts_select_public` — public read when `status = 'AVAILABLE'`
    OR `seller_id = auth.uid()` (sellers see their own at any status).
  - `accounts_select_buyer` — reader has any order on the row (lets a
    buyer view a SOLD listing they purchased).
  - `"seller inserts own account"` — INSERT when `seller_id = auth.uid()`.
  - `accounts_update_own` — UPDATE when `seller_id = auth.uid()` AND
    `status = 'AVAILABLE'`. Locks SOLD listings from edits.
  - `accounts_delete_own` — DELETE when `seller_id = auth.uid()` AND
    `status = 'AVAILABLE'`. Same lock.
- **`credentials`** — read/write only when `seller_id = auth.uid()`.
  The buyer's `reveal_credentials` RPC bypasses this via SECURITY
  DEFINER, gated on order ownership.
- **`orders`** — public has no access. `orders_select_buyer` and
  `orders_select_seller` give the buyer/seller read access to their
  own rows. **No INSERT/UPDATE/DELETE policies**: every write is via a
  SECURITY DEFINER RPC (`place_order`, `mark_order_received`).
- **`offer_reviews`** — public read. INSERT / UPDATE / DELETE only by
  the reviewer. `submit_review` RPC (security definer) is the only
  practical write path; it gates on the caller having an order on the
  listing.
- **`wishlists`** — read / insert / delete only when
  `user_id = auth.uid()`.

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
- **Seller payouts** — no Stripe Connect onboarding. The 5% commission
  is display-only via `src/lib/commission.ts`; real splits land with
  Stripe Connect.
- **Refunds & disputes** — schema supports `REFUNDED` status but no
  handlers / RPC / webhook exist.
- **Admin role** — no `role` column on `profiles` yet; admin tooling is
  out-of-band (Supabase Studio).
- **`offer_reviews.offer_id` is NULLABLE** with FK `ON DELETE SET NULL`.
  Listing deletion would orphan reviews. Currently safe because deletes
  are gated to AVAILABLE (per accounts_delete_own), but data-integrity
  smell — flip to NOT NULL + CASCADE in a future migration once you've
  confirmed no rows have null offer_id.
- **Migrations** — `db/migrations/` is a plain SQL folder applied by hand.
  Works for solo dev but drifts easily (we hit this — see `0014`). If
  the team grows, graduate to the Supabase CLI (`supabase init` +
  `supabase db push`).

---

## 11. When in doubt

- Check what the code actually queries (`grep -n "\.from\(" src/`).
- For a missing column / function error at runtime, the fix is almost always
  in the Supabase SQL editor, not in Prisma.
- Before altering a table, search `src/` for every `.from("table_name")` call
  and make sure the change is backward-compatible with the columns those
  queries select.
