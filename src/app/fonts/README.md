# Local fonts

Drop the following files in this directory. `layout.tsx` imports them via `next/font/local` — the app will fail to build until they're present.

## Required files

**ABC Ginto Nord Widths Variable** (primary display + body)

One of:

- `GintoNord-Variable.woff2` — single variable font file covering all weights (preferred), OR
- Static weights:
  - `GintoNord-Regular.woff2` (400)
  - `GintoNord-Medium.woff2` (500)
  - `GintoNord-Bold.woff2` (700)

If you use the variable file, leave the static-weight block in `layout.tsx` commented out (and vice versa).

## Source

ABC Ginto Nord is a commercial font from **Dinamo** (https://abcdinamo.com). The Figma file references an "Unlicensed Trial" build — do not ship that to production. License before launch.

## Other fonts

- **Inter** and **DM Mono** — loaded from Google Fonts at runtime via `next/font/google`. No files needed.
