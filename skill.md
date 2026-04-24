# Boost V2 — Project Skill Reference

A game-account marketplace. This file is the fast-onboarding doc for anyone (human
or AI) picking up work on the repo. Read `AGENTS.md` and `CLAUDE.md` first —
they're terse but load-bearing. Everything below is **in addition to** those.

---

## 1. Stack

- **Framework:** Next.js 16 (App Router, Turbopack). Many APIs differ from older
  Next versions — **always consult `node_modules/next/dist/docs/` before using
  unfamiliar APIs**.
- **Auth + DB:** Supabase (Postgres with RLS). Live tables:
  `auth.users`, `public.profiles`, `public.games`, `public.accounts`,
  `public.credentials`, `public.offer_reviews`, `public.wishlists`.
  Full schema + RLS intent in `BoostV2_DB_Architecture.md`. Reads/writes go
  through the Supabase JS client; no ORM.
- **Styling:** Tailwind v4 with a brand token palette
  (`brand-accent`, `brand-bg-pill`, `brand-bg-surface`, `brand-border-light`,
  `brand-text-primary-light`, `brand-text-secondary-light`,
  `brand-text-tertiary-dark`, `brand-discount`, `brand-success`, …).
  Font: `font-display` + `font-mono`. Sizes written as arbitrary values
  (`text-[14px]`, `leading-5`), corner radii favour `rounded-xl`, `rounded-2xl`,
  `rounded-3xl`, `rounded-[32px]`.
- **Images:** S3 + presigned PUT URLs for direct-to-browser uploads. Public URLs
  validated on the server to start with `https://`.
- **Payments:** Stripe (scaffolded in `src/lib/stripe.ts`).
- **Encryption:** AES-256-GCM via `node:crypto`. Key is
  `CREDENTIALS_ENCRYPTION_KEY`, server-only.
- **CSV:** `papaparse` (client preview + server re-validation).

## 2. Repo, deploy, workflow

- **Repo:** https://github.com/abhishekgaikwad-stack/BoostV2
- **Deploy:** Vercel → https://boost-v2-sigma.vercel.app
- **Branch:** `main` (push directly; no PR flow in use yet)
- **User's shorthand:** when the user says **"push"** they mean:
  1. `npx tsc --noEmit` (typecheck must pass)
  2. `npm run build` (build must pass)
  3. `git add <specific files>` — **never** `git add .` / `-A`
  4. Commit with HEREDOC message, ending with
     `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
  5. `git push`
- **Commit style:** short subject line, `component/area: what changed`. Body
  explains the *why*. Example:
  `DecimalInput: reject over-max keystrokes; drop €1000 cap on old price`

## 3. Code conventions

- **Client components** declare `"use client"` at the top.
- **Server actions** use `"use server"` + `useActionState` in the consuming
  client form. Pattern: return `{ error?, ok? }`, show inline via
  `state.error` / `state.ok`. Submit button disabled while `pending`.
- **Prices** are stored as integers (cents). Convert on boundary:
  `Math.round(eur * 100)`. Display: `(cents / 100).toFixed(2)`. Cap: **€1000
  on selling price only** (`PRICE_MAX_EUR`, `PRICE_CAP_CENTS` in
  `src/lib/utils.ts`). MRP/old price has **no** cap but must be `>= price`.
- **Decimal inputs** use `<DecimalInput>` from `src/components/forms/`, which
  silently refuses keystrokes that violate `decimals` or `max`. Do **not**
  fall back to `<input type="number">` — the user rejects browser-validation
  popups.
- **Paginated lists** return `ListingPage = { items, nextCursor }` with an
  opaque base64url cursor encoding `(created_at, id)` — see `src/lib/offers.ts`
  helpers (`ListingPage`, `ListingCursor`, `encodeCursor`, `decodeCursor`,
  `ACCOUNT_SELECT`, `toAccount`). New paginated queries should reuse these.
  Always fetch `limit + 1` rows to detect `hasMore` without a separate count.
- **Cross-cutting UI state** (e.g. wishlist) lives in a client Context provider
  mounted at the marketing layout, seeded by a server-fetched snapshot, with
  optimistic toggles that roll back on action error. See
  `src/components/wishlist/WishlistProvider.tsx` for the pattern.
- **Forms** wrap each field in a local `Field` helper:
  `<label><span class="…uppercase tracking…">LABEL</span>{children}</label>`.
- **Images:** `ImageUploader` (`src/components/forms/`) handles presigned PUTs
  + hydration for edit flow. On listing delete, associated S3 objects are
  cleaned via `DeleteObjectsCommand`.
- **Credentials:** `CredentialsFieldset` component + `saveCredentials` helper
  (`src/lib/credentials.ts`). Never log plaintext; never send the key to the
  client.
- **No premature abstraction.** Duplicated inline styles beat a half-baked
  shared component. Three similar JSX blocks is fine; do not extract unless
  the shape is truly stable.
- **Comments:** default to none. Only justify the *why* when non-obvious
  (hidden invariant, workaround, subtle constraint).
- **Game thumbnails** on seller-facing cards use `gameImage(slug)` — **not**
  the listing's own screenshot (learned the hard way).

## 4. File layout

```
src/
  app/
    (auth)/                 (empty — OAuth handled via LoginPopup)
    (dashboard)/            authenticated flows
      sell/                 create + bulk CSV upload (actions.ts, bulk-actions.ts)
      user/
        currently-selling/[offerId]/   edit / delete a listing
      profile/              account + seller toggle + avatar
    (marketing)/            public pages
      games/[slug]/…        game detail + offer detail
      seller/[storeId]/     seller profile
      wishlist/             signed-in-only wishlist page
    api/                    presigned-URL endpoints, avatar, whoami
  components/
    cards/                  SquareProductCard, ProductCard, SellerListingRow…
    forms/                  DecimalInput, ImageUploader, CredentialsFieldset…
    sections/               CreateListingForm, EditListingForm, carousels, UserNav…
    ui/                     primitives (buttons, dialogs)
    wishlist/               WishlistProvider + useWishlist hook
  lib/
    credentials.ts          encrypt/save/load per-listing creds
    csv.ts                  BULK_HEADERS, parseBulkCsv, buildTemplateCsv
    encryption.ts           AES-256-GCM helpers
    images.ts               gameImage() and friends
    offers.ts               read queries + pagination helpers (exported:
                            ListingPage, ListingCursor, ACCOUNT_SELECT, toAccount…)
    sellers.ts              read queries for seller profile page
    wishlist.ts             getMyWishlistIds, getMyWishlistPage
    wishlist-actions.ts     toggleWishlist server action
    s3.ts                   S3 client + presign + delete
    supabase/               server + browser clients
    utils.ts                cn, PRICE_MAX_EUR, PRICE_CAP_CENTS, helpers
db/migrations/              numbered, hand-applied SQL migrations (see README)
BoostV2_DB_Architecture.md  live-DB reference doc (tables, RLS, RPC, indexes)
```

## 5. Key constants & decisions

| Constant              | Value     | Source                                |
|-----------------------|-----------|---------------------------------------|
| `PRICE_MAX_EUR`       | `1000`    | `src/lib/utils.ts`                    |
| `PRICE_CAP_CENTS`     | `100_000` | `src/lib/utils.ts`                    |
| `BULK_MAX_ROWS`       | `500`     | `src/lib/csv.ts`                      |
| Default listing limit | `24`      | `src/lib/offers.ts` (`DEFAULT_LISTING_LIMIT`) |
| Wishlist page limit   | `48`      | `src/app/(marketing)/wishlist/page.tsx` |
| Max images/listing    | `10`      | server actions                        |
| Store ID start        | `100`     | Postgres sequence + trigger on `profiles` |

## 6. Supabase / DB notes

Full schema is documented in `BoostV2_DB_Architecture.md`. SQL changes go in
`db/migrations/NNNN_name.sql` (see `db/migrations/README.md`) and are applied
by hand in the Supabase SQL editor. **Never edit a shipped migration** — if
the change was wrong, write the next numbered file that fixes it.

Tables and their roles:

- `public.profiles` — one row per auth user. `is_seller`, display name,
  avatar, `store_id` (auto-assigned from sequence starting at 100 via a
  trigger).
- `public.games` — static game catalog, keyed by unique `slug`.
- `public.accounts` — the listings. Key columns: `id`, `seller_id`, `game_id`,
  `title`, `description`, `price` (cents), `old_price` (cents nullable),
  `images` (text[]), `status` (`AVAILABLE` | `RESERVED` | `SOLD`),
  `offer_ends_at`, `created_at`. Composite indexes cover the three hot
  listing queries (see migration `0003`):
  `(game_id, status, created_at DESC, id DESC)`,
  `(seller_id, status, created_at DESC, id DESC)`,
  `(status, created_at DESC, id DESC)` — the `id DESC` is the cursor
  tie-breaker.
- `public.credentials` — AES-256-GCM ciphertext blob, 1:1 with `accounts` by
  `account_id`. Plaintext never reaches the DB.
- `public.offer_reviews` — buyer reviews on a listing (currently unused UI
  but read by `fetchOfferReviews`).
- `public.wishlists` — join table `(user_id, account_id)` with composite PK;
  RLS restricts rows to `auth.uid()`.

- **RPC:** `create_listings_bulk(p_game_id uuid, p_listings jsonb)` performs
  an atomic multi-row insert; all rows persist or none do. If the function
  is missing ("Could not find the function…" error), apply the latest
  `create_listings_bulk` body from `db/migrations/` in the SQL editor.
- **RLS is on everywhere.** Server actions use the SSR Supabase client in
  `lib/supabase/server.ts` (cookies → user JWT). When in doubt, assert
  ownership explicitly (e.g. `existing.seller_id !== user.id`) even though
  RLS would also block — the explicit check yields a cleaner error message.

## 7. Common patterns

### Server-action form
```ts
"use client";
const [state, formAction, pending] = useActionState(myAction, initialState);
// <form action={formAction}> … <button disabled={pending}> …
```

### CSV bulk ingest
1. Client parses CSV with `parseBulkCsv` for preview + strict validation.
2. Server action re-validates every row (defence in depth) before calling
   the RPC. Bulk failures are row-precise: `Row 12: price_eur must be ≤ 1000`.
3. Credentials are encrypted on the server before hitting the RPC; DB never
   sees plaintext.

### Presigned S3 upload
1. Client `POST`s to `/api/uploads/...` with content-type → gets a PUT URL.
2. Client `PUT`s directly to S3.
3. Client submits the resulting public URL with the form.
4. Server re-filters URLs to `https://` prefix before persisting.

### Paginated listing query (keyset cursor)
1. Caller passes `{ limit, cursor }`; helper fetches `limit + 1` rows ordered
   by `(created_at DESC, id DESC)`.
2. If a cursor is supplied, filter with
   `created_at.lt.$c OR (created_at.eq.$c AND id.lt.$i)` via `.or(...)`.
3. `buildPage` trims the peek row, encodes the next cursor from the last
   kept row, returns `{ items, nextCursor }`.
4. See `offersForGame`, `offersForSeller`, `recentOffers`, `getMyWishlistPage`
   for working examples.

### Cross-cutting client context (wishlist pattern)
1. Server component (layout) fetches the initial snapshot
   (`getMyWishlistIds`) and passes it to a client `<Provider initialIds enabled>`.
2. Provider holds the state in `useState<Set<string>>`, exposes `isWishlisted`
   and `toggle` via context.
3. `toggle` flips state optimistically, kicks off the server action in a
   `startTransition`, and rolls back on `{ error }`.
4. Consuming components (e.g. `ProductCard`) call the hook — no prop
   threading from pages.

## 8. User preferences learned in conversation

- Wants "pro-level code" — terse, correct, no half-features, no backwards-
  compat shims.
- Prefers **keystroke-level rejection** over post-submit errors for input
  constraints.
- Prefers **CSV uploads** over inline multi-row editors for bulk flows.
- Says "push" → do the full typecheck/build/commit/push cycle; ask before
  force-pushing or doing anything destructive.
- Doesn't want `git add .` / `-A` — stage only the files that were actually
  changed.
- Likes short summaries after a change (what changed, one or two sentences).
- Does **not** want emojis in code or commits unless explicitly asked.
- When a change requires a Supabase SQL-editor step (applying a migration),
  **call it out explicitly** in the response — include the ready-to-paste SQL
  block and a verification query the user can run afterward.
- Open-ended "what's best for X" questions want a **2–3 sentence
  recommendation + tradeoff**, not an essay or an immediate implementation.
  Wait for a green light before writing code.

## 9. Before making changes

- Re-read `AGENTS.md` — especially the "NOT the Next.js you know" warning.
- If touching a Next API you haven't used this week, skim the relevant file
  under `node_modules/next/dist/docs/`.
- Run `npx tsc --noEmit` + `npm run build` before committing. Don't push if
  either fails.
- Verify the memory claim: if this file names a constant/file/flag and you
  are about to act on it, grep to confirm it still exists — this doc can
  drift.
