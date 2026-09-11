/**
 * Root layout — minimal shell required by Next.js App Router.
 * lang and dir are set dynamically by the [locale]/layout.tsx.
 * suppressHydrationWarning prevents mismatch warnings when
 * the locale layout updates these attributes client-side.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
