/**
 * Seed script — populates the database with realistic German content
 * so the SVÖ team sees a real site, not empty shells.
 *
 * Run: npm run seed
 * Requires DATABASE_URI and PAYLOAD_SECRET in .env
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function seed() {
  const payload = await getPayload({ config })

  console.log('🌱 Seeding database…')

  // ─── Bundesländer global ───────────────────────────────────────────────────
  console.log('  → Bundesländer')
  await payload.updateGlobal({
    slug: 'bundeslaender',
    data: {
      items: [
        { code: 'W',    name: { de: 'Wien',              ar: 'فيينا',    en: 'Vienna' } },
        { code: 'NOE',  name: { de: 'Niederösterreich',  ar: 'النمسا السفلى', en: 'Lower Austria' } },
        { code: 'OOE',  name: { de: 'Oberösterreich',    ar: 'النمسا العليا', en: 'Upper Austria' } },
        { code: 'SBG',  name: { de: 'Salzburg',          ar: 'زالتسبورغ', en: 'Salzburg' } },
        { code: 'T',    name: { de: 'Tirol',             ar: 'تيرول',    en: 'Tyrol' } },
        { code: 'VBG',  name: { de: 'Vorarlberg',        ar: 'فورارلبرغ', en: 'Vorarlberg' } },
        { code: 'STMK', name: { de: 'Steiermark',        ar: 'شتاير مارك', en: 'Styria' } },
        { code: 'KTN',  name: { de: 'Kärnten',           ar: 'كارينثيا',  en: 'Carinthia' } },
        { code: 'BGLD', name: { de: 'Burgenland',        ar: 'بورغنلاند', en: 'Burgenland' } },
      ],
    },
  })

  // ─── Site settings ─────────────────────────────────────────────────────────
  console.log('  → SiteSettings')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
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
    },
  })

  // ─── Navigation ────────────────────────────────────────────────────────────
  console.log('  → Navigation')
  await payload.updateGlobal({
    slug: 'navigation',
    data: {
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
    },
  })

  // ─── Service pillars ───────────────────────────────────────────────────────
  console.log('  → Service pillars')
  const pillars = [
    {
      title: { de: 'Bildung & Qualifizierung', ar: 'التعليم والتأهيل', en: 'Education & Qualification' },
      slug: { de: 'bildung-qualifizierung', ar: 'education-qualification', en: 'education-qualification' },
      description: {
        de: '[DE] Sprachkurse, Berufsberatung, Anerkennung ausländischer Abschlüsse.',
        ar: '[AR] دورات لغوية، إرشاد مهني، اعتراف بالمؤهلات الأجنبية.',
        en: '[EN] Language courses, career guidance, recognition of foreign qualifications.',
      },
      icon: 'graduation-cap',
      colourToken: '--color-brand-blue',
      order: 1,
    },
    {
      title: { de: 'Sport, Jugend & Freizeit', ar: 'الرياضة والشباب والترفيه', en: 'Sport, Youth & Leisure' },
      slug: { de: 'sport-jugend-freizeit', ar: 'sport-youth-leisure', en: 'sport-youth-leisure' },
      description: {
        de: '[DE] Sportprogramme, Jugendarbeit, Freizeitangebote für alle Altersgruppen.',
        ar: '[AR] برامج رياضية وعمل شبابي وأنشطة ترفيهية لجميع الأعمار.',
        en: '[EN] Sports programmes, youth work, leisure activities for all age groups.',
      },
      icon: 'trophy',
      colourToken: '--color-brand-green',
      order: 2,
    },
    {
      title: { de: 'Frauen & Familie', ar: 'المرأة والأسرة', en: 'Women & Family' },
      slug: { de: 'frauen-familie', ar: 'women-family', en: 'women-family' },
      description: {
        de: '[DE] Beratung und Unterstützung für Frauen und Familien in Österreich.',
        ar: '[AR] إرشاد ودعم للمرأة والأسر في النمسا.',
        en: '[EN] Counselling and support for women and families in Austria.',
      },
      icon: 'heart',
      colourToken: '--color-brand-blue',
      order: 3,
    },
    {
      title: { de: 'Recht, Beratung & Services', ar: 'القانون والاستشارة والخدمات', en: 'Legal, Advisory & Services' },
      slug: { de: 'recht-beratung-services', ar: 'legal-advisory-services', en: 'legal-advisory-services' },
      description: {
        de: '[DE] Rechtsberatung, Behördennavigation, praktische Unterstützung im Alltag.',
        ar: '[AR] استشارات قانونية، إرشاد في التعامل مع الجهات الحكومية، دعم عملي يومي.',
        en: '[EN] Legal advice, navigating Austrian authorities, practical everyday support.',
      },
      icon: 'scale',
      colourToken: '--color-brand-navy',
      order: 4,
    },
  ]

  for (const pillar of pillars) {
    await payload.create({ collection: 'service-pillars', data: pillar as any })
  }

  // ─── Categories ────────────────────────────────────────────────────────────
  console.log('  → Categories')
  const categories = [
    { name: { de: 'Vereinsnews', ar: 'أخبار الجمعية', en: 'Association news' }, slug: { de: 'vereinsnews', ar: 'association-news', en: 'association-news' }, type: 'news' },
    { name: { de: 'Österreich-Guide', ar: 'دليل النمسا', en: 'Austria guide' }, slug: { de: 'oesterreich-guide', ar: 'austria-guide', en: 'austria-guide' }, type: 'news' },
    { name: { de: 'Workshop', ar: 'ورشة عمل', en: 'Workshop' }, slug: { de: 'workshop', ar: 'workshop', en: 'workshop' }, type: 'event' },
    { name: { de: 'Sportveranstaltung', ar: 'فعالية رياضية', en: 'Sporting event' }, slug: { de: 'sportveranstaltung', ar: 'sporting-event', en: 'sporting-event' }, type: 'event' },
    { name: { de: 'Feier', ar: 'احتفال', en: 'Celebration' }, slug: { de: 'feier', ar: 'celebration', en: 'celebration' }, type: 'event' },
  ]
  for (const cat of categories) {
    await payload.create({ collection: 'categories', data: cat as any })
  }

  console.log('✅ Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
