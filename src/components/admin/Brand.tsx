/**
 * The SVÖ mark in the admin panel: `Logo` on the login screen, `Icon` at the top of the sidebar
 * (`admin.components.graphics` in src/payload.config.ts).
 *
 * No logo file exists yet, so this is the same wordmark the public header uses
 * — bold blue "SVÖ" over the association's name in green — rather than an invented graphic. When
 * the logo arrives, replace the markup here; nothing else refers to it.
 */

const BLUE = '#0B4EA2'
const GREEN = '#3B8A33'

export function Logo() {
  return (
    <div className="svo-brand svo-brand--logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
      <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: '-0.02em', color: BLUE }}>SVÖ</span>
      <span style={{ marginTop: 10, fontSize: 14, fontWeight: 500, color: GREEN }}>Syrischer Verband in Österreich</span>
      <span style={{ marginTop: 6, fontSize: 12, color: 'var(--theme-elevation-500)' }}>Redaktionsbereich</span>
    </div>
  )
}

export function Icon() {
  return (
    <span
      className="svo-brand svo-brand--icon"
      aria-label="SVÖ"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: 8,
        background: BLUE,
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '-0.02em',
      }}
    >
      SVÖ
    </span>
  )
}
