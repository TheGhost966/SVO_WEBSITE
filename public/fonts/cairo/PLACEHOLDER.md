# Cairo font files

Place self-hosted Cairo woff2 files here before deploying.

Required files:
- Cairo-Regular.woff2   (weight 400)
- Cairo-Medium.woff2    (weight 500)
- Cairo-SemiBold.woff2  (weight 600)
- Cairo-Bold.woff2      (weight 700)

Download from Google Fonts (fontsource is easiest):
  npx fontsource download cairo --weight 400,500,600,700 --subset arabic

Self-hosting is required for DSGVO compliance — do NOT load from Google's CDN.
These files are ONLY loaded on the Arabic locale (/ar/) — zero impact on DE/EN performance.
