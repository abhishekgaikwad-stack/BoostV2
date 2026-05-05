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
  `public.credentials`, `public.offer_reviews`, `public.wishlists`,
  `public.orders`. Full schema + RLS intent in `BoostV2_DB_Architecture.md`.
  Reads/writes go through the Supabase JS client; no ORM.
- **Styling:** Tailwind v4 with a brand token palette
  (`brand-accent`, `brand-bg-pill`, `brand-bg-surface`, `brand-border-light`,
  `brand-text-primary-light`, `brand-text-secondary-light`,
  `brand-text-tertiary-dark`, `brand-discount`, `brand-success`, …).
  Font: `font-display` + `font-mono`. Sizes written as arbitrary values
  (`text-[14px]`, `leading-5`). Primary buttons on light bg are `bg-black
  text-white hover:bg-neutral-800 rounded-xl`; on dark bg they're the
  brand-accent gradient (BuyBox + CheckoutSummary). Corner radii: 12px
  for buttons, `rounded-2xl` for inputs/inner cards, `rounded-3xl` /
  `rounded-[32px]` for outer cards.
- **Images:** S3 + presigned PUT URLs for direct-to-browser uploads. Public URLs
  validated on the server to start with `https://`.
- **Payments:** Stripe (scaffolded in `src/lib/stripe.ts`). `place_order`
  currently inserts orders as `PAID` immediately — real Stripe Checkout
  Session + webhooks + Connect payouts are unwired. 5% commission shown
  on the seller side via `src/lib/commission.ts` is display-only until
  Connect lands.
- **Encryption:** AES-256-GCM via `node:crypto`. Key is
  `CREDENTIALS_ENCRYPTION_KEY`, server-only. Buyer reveals plaintext via
  `revealOrderCredentials` action → `reveal_credentials` RPC (security
  definer) → decrypt in Node.
- **CSV:** `papaparse` (client preview + server re-validation).
- **AI:** Anthropic Claude Haiku 4.5 for listing platform/region
  auto-detect via `src/lib/ai-detect.ts`. Key is `ANTHROPIC_API_KEY`,
  server-only. Tool-use call returns strict JSON; surfaces from the
  blur-trigger on the listing form **and** per-row in the bulk CSV
  action when columns are blank.
- **Rate limiting:** Upstash Redis (sliding-window) via
  `src/lib/rate-limit.ts`. Five caps today: AI detect 100/d/user +
  200/d/IP, `placeOrder` 100/d/IP, `createListing` 10/min/user,
  `createBulkListings` 5/h/user. Helper `getClientIp()` reads
  `x-forwarded-for` for IP-scoped paths. Env vars:
  `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
- **Listing-feed cache:** Upstash-backed read cache via
  `src/lib/cache.ts` for the homepage rails (`listGames`,
  `recentOffers`, `firstFlashOffer`). Lazy-init with silent fallback —
  Redis outages or missing env vars degrade to direct DB reads, never
  errors. Mutations call `invalidateListingFeed()`. Reuses the same
  Upstash env vars as rate-limit.
- **PDFs:** `@react-pdf/renderer` (Node-only) for the buyer invoice at
  `/api/invoice/[orderId]`. Boost logo redrawn as `<Svg>` primitives so
  the PDF needs no remote image fetch.

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
        currently-selling/[offerId]/   edit / delete (gates on AVAILABLE)
        orders/             buyer purchase list (My orders)
        sales/              seller sales list
        transactions/       seller transaction log (currently same data as sales)
      profile/              account + seller toggle + avatar
    (marketing)/            public pages
      games/[slug]/[id]     PDP — gallery + description + SellerCard
                            (identity + real seller-wide reviews)
      seller/[storeId]/     seller profile (?tab=listings|reviews,
                            ?sort=newest|highest|lowest, ?page=N)
      checkout/[offerId]/   Buy Now → payment-method selector + summary
      orders/[orderId]/     buyer receipt + Mark-as-received + invoice
      sales/[orderId]/      seller per-sale detail (no buyer info)
      wishlist/             signed-in-only wishlist page
    api/
      auth/callback         OAuth return
      uploads/              avatar + listing-image presigned URLs
      profile/              avatar + account-type
      whoami/               session debug
      invoice/[orderId]/    Node runtime — streams PDF via @react-pdf/renderer
      ai/detect-listing-attrs/  Claude Haiku tool-use, rate-limited
  components/
    auth/                   AuthPromptProvider (login popup orchestrator)
    cards/                  SquareProductCard, ProductCard, SellerListingRow…
    forms/                  DecimalInput (controlled-mode capable),
                            CharCounter + useCharLength,
                            CredentialsFieldset, useAutoDetectListingAttrs,
                            ImageUploader
    sections/               CreateListingForm, EditListingForm,
                            CheckoutBoard / CheckoutSummary,
                            PaymentMethodSelector,
                            BuyBox (status + viewer branching),
                            SellerCard (identity + seller-wide review block),
                            SellerReviewsTab, OrderActions,
                            RevealOrderDetailsDialog (multi-stage: confirm →
                              reveal → confirm-received), ReviewDialog,
                            CommissionBreakdown, ImageCarousel,
                            OrderCard / OrderListRow…
    ui/                     primitives (LocalDate for client-TZ rendering,
                            ConfirmDialog, etc.)
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
    orders.ts               getMyOrder, getMySale, getMyPurchases, getMySales,
                            getMyPurchaseForListing, getMySaleForListing
    orders-actions.ts       placeOrder (calls place_order RPC)
    orders-reveal.ts        revealOrderCredentials (calls reveal_credentials
                            RPC, decrypts on Node side)
    orders-confirm.ts       confirmOrderReceived (calls mark_order_received)
    reviews.ts              getMyReviewForOffer, getSellerReviewStats,
                            getSellerReviewsPage
    reviews-actions.ts      submitReview (calls submit_review RPC)
    review-types.ts         MyReview type + isWithinEditWindow (client-safe,
                            no server imports)
    invoice.tsx             InvoiceDocument + renderInvoicePdf (Node-only)
    ai-detect.ts            detectListingAttrs (server-only Anthropic call)
    rate-limit.ts           Upstash limiters (aiDetect per-user/per-IP,
                            placeOrder, createListing, createBulkListings)
                            + getClientIp helper
    cache.ts                Upstash read cache (cached, invalidate,
                            listingFeedKeys, invalidateListingFeed) —
                            lazy-init, silent fallback on errors
    commission.ts           SELLER_COMMISSION_RATE = 0.05 + cent helpers
    listing-limits.ts       LISTING_LIMITS map + checkLimit helper
    discount.ts             flash-discount validation helpers
    s3.ts                   S3 client + presign + delete
    supabase/               server + browser clients
    utils.ts                cn, PRICE_MAX_EUR, PRICE_CAP_CENTS, helpers
db/migrations/              numbered, hand-applied SQL migrations (see README)
BoostV2_DB_Architecture.md  live-DB reference doc (tables, RLS, RPC, indexes)
```

## 5. Key constants & decisions

| Constant                     | Value     | Source                                |
|------------------------------|-----------|---------------------------------------|
| `PRICE_MAX_EUR`              | `1000`    | `src/lib/utils.ts` (also CHECK in DB) |
| `PRICE_CAP_CENTS`            | `100_000` | `src/lib/utils.ts`                    |
| `SELLER_COMMISSION_RATE`     | `0.05`    | `src/lib/commission.ts`               |
| `BULK_MAX_ROWS`              | `500`     | `src/lib/csv.ts`                      |
| `LISTING_LIMITS.title`       | `200`     | `src/lib/listing-limits.ts`           |
| `LISTING_LIMITS.description` | `1000`    | `src/lib/listing-limits.ts`           |
| `LISTING_LIMITS.platform`    | `50`      | `src/lib/listing-limits.ts`           |
| `LISTING_LIMITS.region`      | `100`     | `src/lib/listing-limits.ts`           |
| `LISTING_LIMITS.credLogin`/`Password`/`Email`/`EmailPassword` | `100` each | `src/lib/listing-limits.ts` |
| `LISTING_LIMITS.credNotes`   | `500`     | `src/lib/listing-limits.ts`           |
| Review body max              | `1500`    | `src/lib/reviews-actions.ts` + DB CHECK + `submit_review` RPC |
| Review edit window           | `30 days` | RPC + `isWithinEditWindow` (`src/lib/review-types.ts`) |
| AI detect rate limit (user)  | `100/day per user` | `src/lib/rate-limit.ts` (`aiDetectPerUserDaily`) |
| AI detect rate limit (IP)    | `200/day per IP`   | `src/lib/rate-limit.ts` (`aiDetectPerIpDaily`)   |
| Place order rate limit       | `100/day per IP`   | `src/lib/rate-limit.ts` (`placeOrderPerIpDaily`) |
| Create listing rate limit    | `10/min per user`  | `src/lib/rate-limit.ts` (`createListingPerUserPerMinute`) |
| Bulk upload rate limit       | `5/h per user`     | `src/lib/rate-limit.ts` (`createBulkListingsPerUserPerHour`) |
| Listing-feed cache TTL — games  | `1 h`           | `src/lib/offers.ts` (`listGames`)                |
| Listing-feed cache TTL — recent | `5 m`           | `src/lib/offers.ts` (`recentOffers`, first page only) |
| Listing-feed cache TTL — flash  | `3 m`           | `src/lib/offers.ts` (`firstFlashOffer`)          |
| Default listing limit        | `24`      | `src/lib/offers.ts` (`DEFAULT_LISTING_LIMIT`) |
| Default review page limit    | `10`      | `src/lib/reviews.ts` (`DEFAULT_REVIEW_LIMIT`) |
| Wishlist page limit          | `48`      | `src/app/(marketing)/wishlist/page.tsx` |
| Max images/listing           | `10`      | server actions                        |
| Order number format          | `o-XXXXXXXX` (8 digits) | `place_order` RPC           |
| Transaction id format        | `t-XXXXXXXXXXXX` (12 digits) | `place_order` RPC      |
| Store ID start               | `100`     | `store_id_seq` + `ensure_store_id()` trigger |

## 6. Supabase / DB notes

Full schema is documented in `BoostV2_DB_Architecture.md`. SQL changes go in
`db/migrations/NNNN_name.sql` (see `db/migrations/README.md`) and are applied
by hand in the Supabase SQL editor. **Never edit a shipped migration** — if
the change was wrong, write the next numbered file that fixes it.

**Migration history is reconstructed.** `0001_baseline.sql` was inferred
from app code; `0014_baseline_reconcile.sql` brings it in line with what's
actually running in prod (real `account_status` ENUM, `offer_reviews.seller_id`,
custom triggers, `accounts.updated_at`, etc.). Always reconcile via
`pg_dump --schema-only` against prod, not from the baseline file.

Tables and their roles:

- `public.profiles` — one row per auth user. `email NOT NULL`, `name`,
  `avatar_url` (S3), `is_seller`, `store_id` (assigned from `store_id_seq`
  on first `is_seller=true` flip via the `ensure_store_id()` trigger),
  `created_at`, `updated_at`.
- `public.games` — static game catalog, keyed by unique `slug`. Includes
  `created_at`.
- `public.accounts` — the listings. Real `account_status` ENUM, plus
  `platform`/`region` (per `0009`), `discount_price`/`discount_ends_at`
  (per `0005`), `updated_at` (per `0014`). Composite indexes cover the
  three hot listing queries (see `0003`):
  `(game_id, status, created_at DESC, id DESC)`,
  `(seller_id, status, created_at DESC, id DESC)`,
  `(status, created_at DESC, id DESC)` — the `id DESC` is the cursor
  tie-breaker.
- `public.credentials` — AES-256-GCM ciphertext blob, 1:1 with `accounts`
  by `account_id`. Plaintext never reaches the DB. Buyer reads via the
  `reveal_credentials` RPC (gated on order ownership).
- `public.offer_reviews` — buyer reviews. `seller_id` is denormalized
  from the listing for fast seller-side queries. UNIQUE
  `(offer_id, reviewer_id)`, body `≤ 1500` chars, 30-day edit window.
  All writes via `submit_review` RPC.
- `public.wishlists` — join table `(user_id, account_id)` with composite
  PK; RLS restricts rows to `auth.uid()`.
- `public.orders` — buyer→listing transactional record. `order_number`
  (`o-XXXXXXXX`) and `transaction_id` (`t-XXXXXXXXXXXX`) are the
  user-facing IDs (URL params, displayed values, cursor pagination); the
  internal UUID `id` is invisible to the app via SELECT alias
  `id:order_number`. `revealed_at` + `marked_received_at` +
  `received_checks` track the post-purchase flow.

- **RPCs (all SECURITY DEFINER):**
  - `create_listings_bulk(p_game_id, p_listings jsonb)` — atomic CSV
    bulk insert.
  - `place_order(p_account_id, p_payment_method)` — atomic checkout;
    inserts order as PAID (stub), flips listing to SOLD, returns
    `order_number` + `transaction_id`.
  - `reveal_credentials(p_order_number)` — buyer-side credential read;
    flips `revealed_at`; returns ciphertext for Node-side decrypt.
  - `mark_order_received(p_order_number, p_checks)` — locks
    `marked_received_at` + records the 4 confirmation flags.
  - `submit_review(p_offer_id, p_rating, p_body)` — verified-buyer
    review create-or-update with 30-day edit window.

  If you see `Could not find the function …` at runtime, the function
  is missing from the database — reapply the latest body from
  `db/migrations/` in the SQL editor and run
  `notify pgrst, 'reload schema';`.

- **RLS is on everywhere.** Server actions use the SSR Supabase client in
  `lib/supabase/server.ts` (cookies → user JWT). When in doubt, assert
  ownership explicitly (e.g. `existing.seller_id !== user.id`) even though
  RLS would also block — the explicit check yields a cleaner error message.
  See `BoostV2_DB_Architecture.md` §6 for the full per-table policy map.

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

### Buyer post-purchase flow
1. **Buy Now** on PDP (`BuyBox`) → navigate to `/checkout/[offerId]`.
   `BuyBox` branches on `isOwner` + `offer.status` + `relatedOrderId`
   so sellers see "Manage listing" / "View sale" and the buyer of a
   SOLD listing sees "View receipt".
2. **Checkout** (`CheckoutBoard` orchestrates `PaymentMethodSelector` +
   `CheckoutSummary`): pick payment method, hit Proceed to Pay →
   `placeOrder` server action → `place_order` RPC → navigate to
   `/orders/[orderId]` (where `orderId` is the public `order_number`).
3. **Order detail** (`/orders/[orderId]`) renders the receipt + the
   `OrderActions` bar (replaces the old standalone reveal button).
   `OrderActions` owns both the reveal-dialog and review-dialog state
   and chains them: after the buyer confirms receipt, it auto-opens
   the review popup if no review exists yet.
4. **Reveal** (`RevealOrderDetailsDialog`): three stages
   `confirm` → `revealing` → `revealed`. Pre-reveal the buyer ticks
   platform/region confirmation; post-reveal credentials are shown
   (server-decrypted, never as static props). The bottom CTA flips
   from `Mark as received` (gradient) to a green
   `Marked as received on <date>` indicator once
   `orders.marked_received_at` is set.
5. **Mark as received** swaps the dialog to a 4-checkbox
   `confirm-received` stage (Account info works / Matches the offer
   description / Access to email / Password changed — email row
   hidden when no email cred). Submit calls `confirmOrderReceived`.
6. **Review** (`ReviewDialog`): 5-star rating + optional ≤ 1500-char
   body. `submitReview` calls `submit_review` RPC; 30-day edit window.
   Reviewer only sees their existing review on the order page (real
   data), and the seller's profile + listing PDP show all the
   seller's reviews via `getSellerReviewsPage` /
   `getSellerReviewStats` (no mock).

### AI listing auto-detect
1. Single-listing form: title + description blurs trigger
   `useAutoDetectListingAttrs` → POST `/api/ai/detect-listing-attrs`
   only if `platform` or `region` is empty.
2. Bulk CSV: `bulk-actions.ts` runs `detectListingAttrs` per row in a
   capped concurrency fan-out (`runWithLimit`, default 5). Same
   per-user 100/day quota; rows that exhaust the quota persist with
   whatever the seller filled in.
3. Server-only via `src/lib/ai-detect.ts` — Anthropic key never
   leaves Node. Strict JSON guaranteed by Claude tool-use.

### Rate limiting
1. `src/lib/rate-limit.ts` exposes five Upstash sliding-window limiters
   plus a `getClientIp()` helper that reads `x-forwarded-for` (falls
   back to `x-real-ip`, then a sentinel bucket). All limiters share the
   same Upstash client constructed via `Redis.fromEnv()`.

   | Limiter                          | Window  | Identifier  | Used by                                                |
   |----------------------------------|---------|-------------|--------------------------------------------------------|
   | `aiDetectPerUserDaily`           | 100/1d  | `user.id`   | `/api/ai/detect-listing-attrs`, `bulk-actions.ts` (per row) |
   | `aiDetectPerIpDaily`             | 200/1d  | client IP   | `/api/ai/detect-listing-attrs` only (skipped per-row in bulk — would break legit 500-row uploads) |
   | `placeOrderPerIpDaily`           | 100/1d  | client IP   | `orders-actions.ts::placeOrder`                        |
   | `createListingPerUserPerMinute`  | 10/1m   | `user.id`   | `sell/actions.ts::createListing`                       |
   | `createBulkListingsPerUserPerHour` | 5/1h  | `user.id`   | `sell/bulk-actions.ts::createBulkListings`             |
2. Stacked-limit pattern (AI detect): user + IP run in parallel via
   `Promise.all` so legit requests pay one round-trip. Both buckets
   tick on every call regardless of outcome — independent counters.
   User-cap error wins when both fail (it's the actionable one).
3. Route handlers return 429 + `X-RateLimit-Limit/Remaining/Reset`
   headers; server actions return their existing `{ error }` /
   `{ ok: false, error }` shape so forms render the message inline.
4. Limit checks run **after auth, before any expensive work** (DB
   writes, AI calls, S3 presigns). Cheaper to reject unauthenticated
   first; cheaper still to reject rate-limited before burning budget.
5. Fail-loud env: `Redis.fromEnv()` throws on import if
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` aren't set —
   silent passthrough would defeat the limit. (Note: `cache.ts` reuses
   the same env vars but is intentionally lazy/fallback — perf layers
   should degrade, security layers should not.)

### Listing-feed cache
1. `src/lib/cache.ts` — thin Upstash wrapper. `cached(key, ttlSec,
   loader)` is get-or-set with a stateless loader; on Redis errors
   (or missing env in dev) it transparently falls back to the loader.
   Nullish results are not cached so newly-arrived rows surface
   immediately.
2. Three Tier 1 reads in `src/lib/offers.ts` are wrapped:
   - `listGames(limit)` — TTL **1 h**, key `feed:games:{limit}`. No
     invalidation hook (games are seeded by DB migration; no
     user-facing path mutates them).
   - `recentOffers({ limit })` — TTL **5 m**, key `feed:recent:{limit}`.
     **Only the first page is cached** — paginated calls past `cursor`
     bypass to keep the key space bounded.
   - `firstFlashOffer()` — TTL **3 m**, key `feed:flash:first`.
3. `invalidateListingFeed()` busts `recentOffers` + `firstFlashOffer`
   keys (`listGames` not currently invalidated, see above). Wired into
   every `accounts` mutation: `createListing`, `createBulkListings`,
   `deleteListing`, `updateListing`, and `placeOrder` (which flips
   status to SOLD via the RPC). Note: `placeOrder` did not previously
   call `revalidatePath('/')` — the cache invalidation now also
   refreshes the homepage rails post-sale.
4. Hard-coded invalidation for `recentOffers` covers `[10]` (the only
   limit currently in use). If a new caller passes a different limit
   and needs to track listing mutations, add it to
   `RECENT_OFFERS_LIMITS` in `cache.ts`.

### Live commission preview
1. `SELLER_COMMISSION_RATE = 0.05` + cent-precise `commissionCents` /
   `payoutCents` in `src/lib/commission.ts`. Single source of truth
   for when Stripe Connect lands.
2. `CreateListingForm` / `EditListingForm` hold `priceText` in
   `useState`, pass `value` + `onValueChange` to the price
   `<DecimalInput>` (controlled mode). `<CommissionBreakdown>`
   renders below the price grid — placeholder when empty,
   3-row breakdown when a price exists.
3. Same breakdown renders below "Sale amount" on `/sales/[orderId]`
   so the seller sees what they actually netted.

### Char-limit feedback (CharCounter)
1. `LISTING_LIMITS` in `src/lib/listing-limits.ts` is the shared
   source of truth — same numbers gate the client UI and the server
   `checkLimit()` validation.
2. `<CharCounter length max />` renders **only when `length > max`**
   (intentionally invisible until breached), in
   `text-brand-discount`. `useCharLength(ref)` listens to native
   `input` events to track length without making the input
   controlled.
3. Wired into title / description / platform / region / all 5
   credential fields.

### URL-driven tabs (seller profile)
1. `/seller/[storeId]?tab=listings|reviews` server-renders the
   appropriate content. Tabs are `<Link>`s, not client state.
2. `?sort=newest|highest|lowest` and `?page=N` round-trip via the
   URL too, so deep-linked review feeds (e.g. PDP "See all reviews")
   land on the right state.

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
