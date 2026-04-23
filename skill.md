# Boost V2 — Project Skill Reference

A game-account marketplace. This file is the fast-onboarding doc for anyone (human
or AI) picking up work on the repo. Read `AGENTS.md` and `CLAUDE.md` first —
they're terse but load-bearing. Everything below is **in addition to** those.

---

## 1. Stack

- **Framework:** Next.js 16 (App Router, Turbopack). Many APIs differ from older
  Next versions — **always consult `node_modules/next/dist/docs/` before using
  unfamiliar APIs**.
- **Auth + DB:** Supabase (Postgres with RLS, `auth.users`, `public.profiles`,
  `public.accounts`, `public.credentials`).
- **ORM-ish:** Prisma schema lives under `prisma/` but DB writes from server
  actions mostly go through the Supabase client.
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
    (auth)/                 signin, signup, callback
    (dashboard)/            authenticated flows
      sell/                 create + bulk CSV upload
      user/
        currently-selling/[offerId]/   edit / delete a listing
      profile/              account + seller toggle + avatar
    (marketing)/            public pages
    api/                    presigned-URL endpoints, avatar, whoami
  components/
    cards/                  SquareProductCard, ProductCard, SellerListingRow…
    forms/                  DecimalInput, ImageUploader, CredentialsFieldset…
    sections/               CreateListingForm, EditListingForm, carousels…
    ui/                     primitives (buttons, dialogs)
  lib/
    credentials.ts          encrypt/save/load per-listing creds
    csv.ts                  BULK_HEADERS, parseBulkCsv, buildTemplateCsv
    encryption.ts           AES-256-GCM helpers
    images.ts               gameImage() and friends
    offers.ts / sellers.ts  read-side queries
    s3.ts                   S3 client + presign + delete
    supabase/               server + browser clients
    utils.ts                cn, PRICE_MAX_EUR, PRICE_CAP_CENTS, helpers
db/migrations/              hand-applied SQL migrations (see README)
```

## 5. Key constants & decisions

| Constant           | Value     | Source                    |
|--------------------|-----------|---------------------------|
| `PRICE_MAX_EUR`    | `1000`    | `src/lib/utils.ts`        |
| `PRICE_CAP_CENTS`  | `100_000` | `src/lib/utils.ts`        |
| `BULK_MAX_ROWS`    | `500`     | `src/lib/csv.ts`          |
| Max images/listing | `10`      | server actions            |
| Store ID start     | `100`     | Postgres sequence + trigger on `profiles` |

## 6. Supabase / DB notes

Schema is documented in `BoostV2_DB_Architecture.md`. SQL changes go in
`db/migrations/NNNN_name.sql` (see `db/migrations/README.md`) and are
applied by hand in the Supabase SQL editor.


- `public.accounts` = listings. Key columns: `id`, `seller_id`, `game_id`,
  `title`, `description`, `price` (cents), `old_price` (cents nullable),
  `images` (text[]), `status` (`AVAILABLE` etc.).
- `public.profiles`: one row per auth user, stores `is_seller` flag, display
  name, avatar, `store_id` (auto-assigned from sequence starting at 100).
- `public.credentials`: ciphertext blob keyed by listing id + seller id.
- **RPC:** `create_listings_bulk(p_game_id uuid, p_listings jsonb)` performs
  an atomic multi-row insert; all rows persist or none do. If the function
  is missing ("Could not find the function…" error), paste the SQL from our
  prior convo into the Supabase SQL editor.
- **RLS is on.** Server actions use the service-role client in
  `lib/supabase/server.ts` via SSR cookies. When in doubt, assert ownership
  explicitly (e.g. `existing.seller_id !== user.id`) even when RLS would
  block — the explicit check yields a cleaner error message.

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

## 9. Before making changes

- Re-read `AGENTS.md` — especially the "NOT the Next.js you know" warning.
- If touching a Next API you haven't used this week, skim the relevant file
  under `node_modules/next/dist/docs/`.
- Run `npx tsc --noEmit` + `npm run build` before committing. Don't push if
  either fails.
- Verify the memory claim: if this file names a constant/file/flag and you
  are about to act on it, grep to confirm it still exists — this doc can
  drift.
