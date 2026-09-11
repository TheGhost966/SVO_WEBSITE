import localFont from 'next/font/local'

/**
 * Inter — Latin script (DE + EN).
 * Files must be placed at public/fonts/inter/ — see CONTENT-NEEDED.md.
 * Download subset from https://rsms.me/inter/ or Google Fonts (self-host, DSGVO).
 */
export const inter = localFont({
  src: [
    {
      path: '../../public/fonts/inter/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

/**
 * Cairo — Arabic script.
 * Files must be placed at public/fonts/cairo/ — see CONTENT-NEEDED.md.
 * Download from Google Fonts (self-host, DSGVO).
 */
export const cairo = localFont({
  src: [
    {
      path: '../../public/fonts/cairo/Cairo-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/cairo/Cairo-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/cairo/Cairo-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/cairo/Cairo-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-cairo',
  display: 'swap',
  preload: false, // Only loaded for Arabic locale — preloading globally wastes bandwidth
})
