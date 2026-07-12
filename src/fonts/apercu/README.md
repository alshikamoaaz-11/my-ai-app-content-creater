# Apercu font files

This directory is the drop-in location for the licensed Apercu font files.
It is empty by default — Apercu is a commercial typeface and its files are
**not bundled in this repo**. Until real files are placed here, typography
falls back to Tahoma automatically (see `src/fonts/apercu.generated.ts`).

## Expected files

Place these exact filenames directly in this directory:

| File                 | Weight | Style  |
| --------------------- | ------ | ------ |
| `Apercu-Regular.woff2` | 400    | normal |
| `Apercu-Medium.woff2`  | 500    | normal |
| `Apercu-Bold.woff2`    | 700    | normal |

`.woff2` is required (no `.ttf`/`.otf` fallback is read by the generator).
To add more weights/styles (e.g. italics), extend the `WEIGHTS` array in
`scripts/generate-apercu-font.mjs` to match.

## Activating Apercu

No code changes needed. Once all three files above exist in this directory:

1. Run `npm run dev` or `npm run build` as usual.
2. The `predev`/`prebuild` npm hook runs `scripts/generate-apercu-font.mjs`,
   which detects the files and regenerates `src/fonts/apercu.generated.ts`
   to self-host them via `next/font/local`.
3. The app now renders with Apercu as the primary font, Tahoma as the
   configured `next/font` fallback, and Tajawal still guaranteeing Arabic
   glyph quality (see `src/app/globals.css`).

If the files are ever removed again, the next `dev`/`build` run regenerates
the no-op fallback automatically.
