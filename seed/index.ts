/**
 * Seed script — populates the database so the SVÖ team sees a real site, not empty shells.
 *
 * Run: npm run seed
 *
 * Runs inside the Next.js boot pipeline (via `SEED_ON_BOOT` in `src/instrumentation.node.ts`),
 * not as a standalone tsx script. Same reason the migration commands moved there: every
 * standalone entry point that loads `payload.config.ts` through tsx dies in Payload's own
 * ESM/CJS interop — here it surfaced as `Cannot destructure property 'loadEnvConfig' of
 * 'import_env.default'` from `payload/dist/bin/loadEnv.js`, because tsx's CJS transform resolves
 * `@next/env`'s interop default to undefined. `next dev`/`next build` load the same config fine
 * (Turbopack/SWC, no tsx), so running there sidesteps it.
 *
 * Two parts:
 *   1. Configuration the site genuinely needs (site settings, navigation, service pillars,
 *      categories). Real values, safe to keep.
 *   2. Sample content for the collections that drive the homepage (`seed/sampleContent.ts`).
 *      Placeholder text, clearly marked, meant to be replaced before launch. Skip it with
 *      SEED_SAMPLE_CONTENT=false.
 *
 * Every write is keyed on a slug or name and skipped if already present, so the script is safe
 * to re-run — after a database reset, on a fresh Neon branch, or to top up a partial seed.
 *
 * Requires DATABASE_URI and PAYLOAD_SECRET in .env.local
 */
import type { Payload } from 'payload'
import { makeHelpers, richText, SAMPLE_NOTICE, type L10n } from './lib'
import { seedSampleContent } from './sampleContent'

export async function runSeed(payload: Payload) {
  const { updateGlobalLocalized, upsert } = makeHelpers(payload)
  const log = (what: string, r: { created: boolean }) =>
    console.log(`      ${r.created ? '+' : '·'} ${what}${r.created ? '' : ' (exists, skipped)'}`)

  console.log('\n🌱 Seeding database…\n')

  // ─── Site settings ─────────────────────────────────────────────────────────
  console.log('  → SiteSettings')
  await updateGlobalLocalized('site-settings', {
    orgName: {
      de: 'SVÖ — Syrischer Verband in Österreich',
      ar: 'الاتحاد السوري في النمسا',
      en: 'SVÖ — Syrian Association in Austria',
    },
    tagline: {
      de: 'Bauen. Verbinden. Umsetzen.',
      ar: 'نبني · نربط · ننفذ',
      en: 'Building. Connecting. Delivering.',
    },
    contactGroup: {
      address: '[DE] Adresse wird vom SVÖ-Team bereitgestellt',
      email: 'info@svoe.at',
    },
    seoGroup: {
      defaultTitle: {
        de: 'SVÖ — Syrischer Verband in Österreich',
        ar: 'الاتحاد السوري في النمسا',
        en: 'SVÖ — Syrian Association in Austria',
      },
      defaultDescription: {
        de: 'Der SVÖ unterstützt die syrische Gemeinschaft in allen neun österreichischen Bundesländern.',
        ar: 'يدعم الاتحاد السوري المجتمع السوري في النمسا.',
        en: 'SVÖ supports the Syrian community across all nine Austrian states.',
      },
    },
    submissionRetentionMonths: 12,
    boardNotificationEmails: [{ email: process.env.BOARD_NOTIFICATION_EMAIL ?? 'alexalexltesgo@gmail.com' }],
  })

  // ─── Navigation ────────────────────────────────────────────────────────────
  console.log('  → Navigation')
  await updateGlobalLocalized('navigation', {
    header: {
      de: [
        { label: 'Über uns', url: '/ueber-uns' },
        { label: 'Nachrichten', url: '/nachrichten' },
        { label: 'Veranstaltungen', url: '/veranstaltungen' },
        { label: 'Leistungen', url: '/leistungen' },
        { label: 'Kontakt', url: '/kontakt' },
      ],
      ar: [
        { label: 'من نحن', url: '/about' },
        { label: 'أخبار', url: '/news' },
        { label: 'فعاليات', url: '/events' },
        { label: 'خدمات', url: '/services' },
        { label: 'اتصل بنا', url: '/contact' },
      ],
      en: [
        { label: 'About', url: '/about' },
        { label: 'News', url: '/news' },
        { label: 'Events', url: '/events' },
        { label: 'Services', url: '/services' },
        { label: 'Contact', url: '/contact' },
      ],
    },
    footer: {
      de: [
        { label: 'Impressum', url: '/impressum' },
        { label: 'Datenschutzerklärung', url: '/datenschutz' },
        { label: 'Barrierefreiheitserklärung', url: '/barrierefreiheit' },
      ],
      ar: [
        { label: 'Impressum', url: '/impressum' },
        { label: 'Datenschutzerklärung', url: '/datenschutz' },
        { label: 'Barrierefreiheitserklärung', url: '/barrierefreiheit' },
      ],
      en: [
        { label: 'Impressum', url: '/impressum' },
        { label: 'Privacy Policy', url: '/privacy-policy' },
        { label: 'Accessibility', url: '/accessibility' },
      ],
    },
  })

  // ─── Service pillars ───────────────────────────────────────────────────────
  console.log('  → Service pillars')
  const pillars: Array<{
    slug: string
    icon: string
    colourToken: string
    order: number
    title: L10n
    description: L10n
  }> = [
    {
      slug: 'bildung-qualifizierung',
      icon: 'graduation-cap',
      colourToken: '--color-brand-blue',
      order: 1,
      title: { de: 'Bildung & Qualifizierung', ar: 'التعليم والتأهيل', en: 'Education & Qualification' },
      description: {
        de: 'Sprachkurse, Berufsberatung, Anerkennung ausländischer Abschlüsse.',
        ar: 'دورات لغوية، إرشاد مهني، اعتراف بالمؤهلات الأجنبية.',
        en: 'Language courses, career guidance, recognition of foreign qualifications.',
      },
    },
    {
      slug: 'sport-jugend-freizeit',
      icon: 'trophy',
      colourToken: '--color-brand-green',
      order: 2,
      title: { de: 'Sport, Jugend & Freizeit', ar: 'الرياضة والشباب والترفيه', en: 'Sport, Youth & Leisure' },
      description: {
        de: 'Sportprogramme, Jugendarbeit, Freizeitangebote für alle Altersgruppen.',
        ar: 'برامج رياضية وعمل شبابي وأنشطة ترفيهية لجميع الأعمار.',
        en: 'Sports programmes, youth work, leisure activities for all age groups.',
      },
    },
    {
      slug: 'frauen-familie',
      icon: 'heart',
      colourToken: '--color-brand-blue',
      order: 3,
      title: { de: 'Frauen & Familie', ar: 'المرأة والأسرة', en: 'Women & Family' },
      description: {
        de: 'Beratung und Unterstützung für Frauen und Familien in Österreich.',
        ar: 'إرشاد ودعم للمرأة والأسر في النمسا.',
        en: 'Counselling and support for women and families in Austria.',
      },
    },
    {
      slug: 'recht-beratung-services',
      icon: 'scale',
      colourToken: '--color-brand-navy',
      order: 4,
      title: { de: 'Recht, Beratung & Services', ar: 'القانون والاستشارة والخدمات', en: 'Legal, Advisory & Services' },
      description: {
        de: 'Rechtsberatung, Behördennavigation, praktische Unterstützung im Alltag.',
        ar: 'استشارات قانونية، إرشاد في التعامل مع الجهات الحكومية، دعم عملي يومي.',
        en: 'Legal advice, navigating Austrian authorities, practical everyday support.',
      },
    },
  ]

  const pillarIds: Record<string, string | number> = {}
  for (const p of pillars) {
    const res = await upsert('service-pillars', 'slug', p.slug, p)
    pillarIds[p.slug] = res.id
    log(p.slug, res)
  }

  // ─── Categories ────────────────────────────────────────────────────────────
  console.log('  → Categories')
  const categories: Array<{ slug: string; type: string; name: L10n }> = [
    { slug: 'vereinsnews', type: 'news', name: { de: 'Vereinsnews', ar: 'أخبار الجمعية', en: 'Association news' } },
    { slug: 'oesterreich-guide', type: 'news', name: { de: 'Österreich-Guide', ar: 'دليل النمسا', en: 'Austria guide' } },
    { slug: 'workshop', type: 'event', name: { de: 'Workshop', ar: 'ورشة عمل', en: 'Workshop' } },
    { slug: 'sportveranstaltung', type: 'event', name: { de: 'Sportveranstaltung', ar: 'فعالية رياضية', en: 'Sporting event' } },
    { slug: 'feier', type: 'event', name: { de: 'Feier', ar: 'احتفال', en: 'Celebration' } },
    { slug: 'recht', type: 'expert', name: { de: 'Recht', ar: 'القانون', en: 'Legal' } },
    { slug: 'steuern', type: 'expert', name: { de: 'Steuern', ar: 'الضرائب', en: 'Tax' } },
    { slug: 'gesundheit', type: 'expert', name: { de: 'Gesundheit', ar: 'الصحة', en: 'Health' } },
    { slug: 'bildung', type: 'expert', name: { de: 'Bildung', ar: 'التعليم', en: 'Education' } },
  ]
  for (const c of categories) {
    const res = await upsert('categories', 'slug', c.slug, c)
    log(c.slug, res)
  }

  // ─── Services ──────────────────────────────────────────────────────────────
  // One per pillar, so /leistungen and each pillar page have something behind them.
  console.log('  → Services')
  const services: Array<{ slug: string; pillar: string; icon: string; title: L10n; summary: L10n }> = [
    {
      slug: 'sprachkurs-beratung',
      pillar: 'bildung-qualifizierung',
      icon: 'graduation-cap',
      title: { de: 'Beratung zu Sprachkursen', ar: 'إرشاد حول دورات اللغة', en: 'Language course guidance' },
      summary: {
        de: 'Orientierung über Kursangebote, Niveaustufen und mögliche Förderungen.',
        ar: 'إرشاد حول الدورات المتاحة والمستويات وإمكانيات الدعم.',
        en: 'Orientation on available courses, levels and possible funding.',
      },
    },
    {
      slug: 'jugendtreff',
      pillar: 'sport-jugend-freizeit',
      icon: 'trophy',
      title: { de: 'Jugendtreff und Sportgruppen', ar: 'ملتقى الشباب والمجموعات الرياضية', en: 'Youth meetups and sports groups' },
      summary: {
        de: 'Regelmäßige Treffen und Sportangebote für Jugendliche in der Community.',
        ar: 'لقاءات منتظمة وأنشطة رياضية للشباب في المجتمع.',
        en: 'Regular meetups and sports activities for young people in the community.',
      },
    },
    {
      slug: 'familienberatung',
      pillar: 'frauen-familie',
      icon: 'heart',
      title: { de: 'Beratung für Frauen und Familien', ar: 'إرشاد للنساء والأسر', en: 'Advice for women and families' },
      summary: {
        de: 'Vertrauliche Erstberatung und Weitervermittlung an passende Stellen.',
        ar: 'استشارة أولية سرية وإحالة إلى الجهات المناسبة.',
        en: 'Confidential initial advice and referral to the right services.',
      },
    },
    {
      slug: 'behoerdenbegleitung',
      pillar: 'recht-beratung-services',
      icon: 'scale',
      title: { de: 'Begleitung zu Behörden', ar: 'مرافقة إلى الدوائر الرسمية', en: 'Support with authorities' },
      summary: {
        de: 'Unterstützung beim Verstehen von Schreiben und bei Behördenterminen.',
        ar: 'دعم في فهم المراسلات ومواعيد الدوائر الرسمية.',
        en: 'Help understanding official letters and attending appointments.',
      },
    },
  ]
  for (const sv of services) {
    const res = await upsert('services', 'slug', sv.slug, {
      title: sv.title,
      slug: sv.slug,
      pillar: pillarIds[sv.pillar],
      icon: sv.icon,
      summary: sv.summary,
      body: {
        de: richText(SAMPLE_NOTICE.de, sv.summary.de),
        ar: richText(SAMPLE_NOTICE.ar, sv.summary.ar),
        en: richText(SAMPLE_NOTICE.en, sv.summary.en),
      },
      reviewStatus: 'published',
    })
    log(sv.slug, res)
  }

  // ─── Sample content ────────────────────────────────────────────────────────
  if (process.env.SEED_SAMPLE_CONTENT === 'false') {
    console.log('\n  (SEED_SAMPLE_CONTENT=false — skipping sample content)\n')
  } else {
    console.log('\n  ── Sample content (placeholder, replace before launch) ──')
    await seedSampleContent(payload)
    console.log(
      '\n⚠  The seeded entries are PLACEHOLDERS for design review. Every one carries a visible\n' +
        '   "BEISPIELINHALT / SAMPLE CONTENT" notice in its body. They must be replaced with real,\n' +
        '   board-approved content before the site goes live.',
    )
  }

  console.log('\n✅ Seed complete.\n')
}
