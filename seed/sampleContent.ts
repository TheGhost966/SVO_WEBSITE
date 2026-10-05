/**
 * Placeholder content for the collections that drive the homepage.
 *
 * Why this exists: six of the homepage's ten sections (`RoadmapsSection`, `GuideSection`,
 * `ExpertsSection`, `JobsSection`, `EventsSection`, `NewsSection`) call `return null` when their
 * query comes back empty, so an empty database renders as a four-section homepage that looks
 * nothing like the Figma — and looks broken rather than unfinished. This fills them so the
 * layout can actually be reviewed.
 *
 * Everything written here is scaffolding, not copy. Read the `SAMPLE_NOTICE` comment in
 * `seed/lib.ts` for the rules this content follows — in short: marked in every body, no invented
 * specifics, real official source links, fictional people obviously labelled.
 *
 * Re-runnable: every write is keyed on a slug (or name) and skipped when already present.
 */
import type { Payload } from 'payload'
import { makeHelpers, richText, SAMPLE_NOTICE, SAMPLE_PERSON, type L10n } from './lib'

/** Real, stable Austrian information sources — not invented. */
const SOURCES = {
  oesterreichGvAt: 'https://www.oesterreich.gv.at/',
  ams: 'https://www.ams.at/',
  integrationsfonds: 'https://www.integrationsfonds.at/',
  wien: 'https://www.wien.gv.at/',
  help: 'https://www.help.gv.at/',
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(18, 0, 0, 0)
  return d.toISOString()
}

export async function seedSampleContent(payload: Payload) {
  const { upsert } = makeHelpers(payload)
  const log = (what: string, r: { created: boolean }) =>
    console.log(`      ${r.created ? '+' : '·'} ${what}${r.created ? '' : ' (exists, skipped)'}`)

  /**
   * Categories are created by `seed/index.ts` before this runs. Resolving them by slug here
   * wires the relationships that several bits of UI depend on being non-empty: the experts
   * teaser's filter chips read `getExpertCategories()`, and the news/events index pages only
   * render their `CategoryFilter` when at least one category is attached to something.
   */
  async function categoryId(slug: string): Promise<string | number | undefined> {
    const found = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    return found.docs[0]?.id
  }
  const cat = Object.fromEntries(
    await Promise.all(
      ['vereinsnews', 'oesterreich-guide', 'workshop', 'sportveranstaltung', 'feier', 'recht', 'steuern', 'gesundheit', 'bildung'].map(
        async (slug) => [slug, await categoryId(slug)] as const,
      ),
    ),
  ) as Record<string, string | number | undefined>

  // ─── Roadmaps ──────────────────────────────────────────────────────────────
  console.log('  → Roadmaps')
  const roadmaps: Array<{
    slug: string
    icon: string
    /** Situation-quiz tags — see src/lib/quiz.ts. */
    quizMatches: string[]
    title: L10n
    description: L10n
    source: string
    steps: Array<{ title: L10n; description: L10n; authority: L10n; timing: L10n }>
  }> = [
    {
      slug: 'anmeldung-in-oesterreich',
      quizMatches: ['newly_arrived', 'residence_permit'],
      icon: 'map-pin',
      title: {
        de: 'Ankommen und anmelden',
        ar: 'الوصول والتسجيل',
        en: 'Arriving and registering',
      },
      description: {
        de: 'Die ersten behördlichen Schritte nach der Ankunft in Österreich — in der Reihenfolge, in der sie üblicherweise anfallen.',
        ar: 'الخطوات الرسمية الأولى بعد الوصول إلى النمسا — بالترتيب المعتاد.',
        en: 'The first official steps after arriving in Austria, in the order they usually come up.',
      },
      source: SOURCES.oesterreichGvAt,
      steps: [
        {
          title: { de: 'Wohnsitz anmelden', ar: 'تسجيل محل الإقامة', en: 'Register your residence' },
          description: {
            de: 'Die Meldung des Wohnsitzes ist in Österreich verpflichtend und erfolgt beim Meldeservice der Gemeinde. Die genauen Fristen und Unterlagen entnehmen Sie der offiziellen Quelle.',
            ar: 'تسجيل محل الإقامة إلزامي في النمسا ويتم لدى دائرة التسجيل في البلدية. راجع المصدر الرسمي للمهل والمستندات المطلوبة.',
            en: 'Registering your address is mandatory in Austria and is done at the municipal registration office. Check the official source for exact deadlines and documents.',
          },
          authority: { de: 'Meldeservice der Gemeinde', ar: 'دائرة التسجيل في البلدية', en: 'Municipal registration office' },
          timing: { de: 'Kurz nach der Ankunft', ar: 'بعد الوصول بفترة قصيرة', en: 'Shortly after arrival' },
        },
        {
          title: { de: 'Sozialversicherungsnummer klären', ar: 'توضيح رقم الضمان الاجتماعي', en: 'Sort out your social insurance number' },
          description: {
            de: 'Die Sozialversicherungsnummer wird für Arbeit, Gesundheitsversorgung und viele Anträge benötigt. Wie sie vergeben wird, hängt von Ihrer Situation ab.',
            ar: 'رقم الضمان الاجتماعي مطلوب للعمل والرعاية الصحية والعديد من الطلبات. تعتمد طريقة إصداره على وضعك.',
            en: 'The social insurance number is needed for work, healthcare and many applications. How it is issued depends on your situation.',
          },
          authority: { de: 'Sozialversicherungsträger', ar: 'مؤسسة الضمان الاجتماعي', en: 'Social insurance provider' },
          timing: { de: 'Nach der Wohnsitzmeldung', ar: 'بعد تسجيل الإقامة', en: 'After registering your address' },
        },
        {
          title: { de: 'Bankkonto eröffnen', ar: 'فتح حساب مصرفي', en: 'Open a bank account' },
          description: {
            de: 'Ein Konto wird für Miete, Gehalt und Behördenzahlungen gebraucht. Welche Unterlagen die Bank verlangt, unterscheidet sich je nach Institut.',
            ar: 'الحساب المصرفي ضروري للإيجار والراتب والمدفوعات الرسمية. تختلف المستندات المطلوبة من بنك لآخر.',
            en: 'An account is needed for rent, salary and payments to authorities. Required documents vary between banks.',
          },
          authority: { de: 'Bank Ihrer Wahl', ar: 'البنك الذي تختاره', en: 'A bank of your choice' },
          timing: { de: 'Sobald die Meldebestätigung vorliegt', ar: 'بمجرد توفر تأكيد التسجيل', en: 'Once you have your registration confirmation' },
        },
      ],
    },
    {
      slug: 'deutschkurs-finden',
      quizMatches: ['learning_german', 'newly_arrived'],
      icon: 'graduation-cap',
      title: { de: 'Deutschkurs finden', ar: 'إيجاد دورة لغة ألمانية', en: 'Finding a German course' },
      description: {
        de: 'Von der Einstufung bis zum anerkannten Zertifikat — welche Stellen dabei eine Rolle spielen.',
        ar: 'من تحديد المستوى إلى الشهادة المعتمدة — الجهات المعنية بذلك.',
        en: 'From placement test to a recognised certificate, and which bodies are involved.',
      },
      source: SOURCES.integrationsfonds,
      steps: [
        {
          title: { de: 'Sprachniveau einstufen lassen', ar: 'تحديد مستوى اللغة', en: 'Get your level assessed' },
          description: {
            de: 'Eine Einstufung sorgt dafür, dass der Kurs zum tatsächlichen Niveau passt. Viele Anbieter bieten sie kostenlos an.',
            ar: 'يضمن تحديد المستوى أن تناسب الدورة مستواك الفعلي. يقدمها كثير من المزودين مجاناً.',
            en: 'A placement test makes sure the course matches your actual level. Many providers offer it free of charge.',
          },
          authority: { de: 'Kursanbieter / ÖIF', ar: 'مزود الدورة / الصندوق النمساوي للاندماج', en: 'Course provider / Austrian Integration Fund' },
          timing: { de: 'Vor der Anmeldung', ar: 'قبل التسجيل', en: 'Before enrolling' },
        },
        {
          title: { de: 'Förderung prüfen', ar: 'التحقق من الدعم المالي', en: 'Check funding options' },
          description: {
            de: 'Je nach Aufenthaltstitel und Erwerbsstatus kommen unterschiedliche Förderungen infrage. Die offizielle Quelle listet die Zuständigkeiten auf.',
            ar: 'تختلف أشكال الدعم حسب تصريح الإقامة وحالة العمل. يسرد المصدر الرسمي الجهات المختصة.',
            en: 'Depending on your residence status and employment situation, different funding schemes may apply. The official source lists who is responsible.',
          },
          authority: { de: 'ÖIF / AMS / Land', ar: 'ÖIF / AMS / الولاية', en: 'ÖIF / AMS / provincial government' },
          timing: { de: 'Vor Kursbeginn', ar: 'قبل بدء الدورة', en: 'Before the course starts' },
        },
        {
          title: { de: 'Kurs abschließen und Zertifikat erhalten', ar: 'إنهاء الدورة والحصول على الشهادة', en: 'Finish the course and get your certificate' },
          description: {
            de: 'Ein anerkanntes Zertifikat wird bei vielen Anträgen verlangt. Achten Sie darauf, dass der Anbieter anerkannt ist.',
            ar: 'تُطلب الشهادة المعتمدة في كثير من الطلبات. تأكد من أن المزود معتمد.',
            en: 'A recognised certificate is required for many applications. Make sure the provider is officially recognised.',
          },
          authority: { de: 'Anerkannter Prüfungsanbieter', ar: 'جهة امتحان معتمدة', en: 'Recognised examination provider' },
          timing: { de: 'Am Kursende', ar: 'في نهاية الدورة', en: 'At the end of the course' },
        },
      ],
    },
    {
      slug: 'arbeit-suchen',
      quizMatches: ['job_seeking', 'qualification_recognition'],
      icon: 'briefcase',
      title: { de: 'Arbeit suchen', ar: 'البحث عن عمل', en: 'Looking for work' },
      description: {
        de: 'Welche Stellen bei der Arbeitssuche in Österreich unterstützen und in welcher Reihenfolge man sie kontaktiert.',
        ar: 'الجهات التي تدعم البحث عن عمل في النمسا وترتيب التواصل معها.',
        en: 'Which bodies support a job search in Austria, and the order in which to approach them.',
      },
      source: SOURCES.ams,
      steps: [
        {
          title: { de: 'Beim AMS melden', ar: 'التسجيل لدى AMS', en: 'Register with the AMS' },
          description: {
            de: 'Das Arbeitsmarktservice ist die zentrale Anlaufstelle für Arbeitssuchende und vermittelt auch Qualifizierungen.',
            ar: 'دائرة سوق العمل هي الجهة المركزية للباحثين عن عمل وتوفر أيضاً برامج تأهيل.',
            en: 'The public employment service is the central point of contact for jobseekers and also arranges training.',
          },
          authority: { de: 'AMS', ar: 'AMS', en: 'AMS' },
          timing: { de: 'Zu Beginn der Arbeitssuche', ar: 'في بداية البحث عن عمل', en: 'At the start of your job search' },
        },
        {
          title: { de: 'Qualifikationen anerkennen lassen', ar: 'الاعتراف بالمؤهلات', en: 'Get your qualifications recognised' },
          description: {
            de: 'Im Ausland erworbene Abschlüsse müssen für viele Berufe formal bewertet oder anerkannt werden.',
            ar: 'تحتاج الشهادات المكتسبة في الخارج إلى تقييم أو اعتراف رسمي لكثير من المهن.',
            en: 'Qualifications earned abroad need formal assessment or recognition for many professions.',
          },
          authority: { de: 'Zuständige Anerkennungsstelle', ar: 'جهة الاعتراف المختصة', en: 'The relevant recognition body' },
          timing: { de: 'Parallel zur Arbeitssuche', ar: 'بالتوازي مع البحث عن عمل', en: 'Alongside your job search' },
        },
        {
          title: { de: 'Bewerbungsunterlagen vorbereiten', ar: 'تحضير مستندات التقديم', en: 'Prepare your application documents' },
          description: {
            de: 'Lebenslauf und Anschreiben folgen in Österreich bestimmten Konventionen. Beratungsstellen helfen kostenlos dabei.',
            ar: 'تتبع السيرة الذاتية وخطاب التقديم أعرافاً معينة في النمسا. تساعد مراكز الإرشاد في ذلك مجاناً.',
            en: 'CVs and cover letters follow particular conventions in Austria. Advice centres help with this free of charge.',
          },
          authority: { de: 'AMS / Beratungsstellen', ar: 'AMS / مراكز الإرشاد', en: 'AMS / advice centres' },
          timing: { de: 'Laufend', ar: 'بشكل مستمر', en: 'Ongoing' },
        },
      ],
    },
    {
      slug: 'wohnung-finden',
      quizMatches: ['housing', 'newly_arrived'],
      icon: 'home',
      title: { de: 'Wohnung finden', ar: 'إيجاد سكن', en: 'Finding a flat' },
      description: {
        de: 'Worauf bei Mietvertrag, Kaution und Wohnbeihilfe zu achten ist — und wer dabei zuständig ist.',
        ar: 'ما يجب الانتباه له في عقد الإيجار والتأمين وإعانة السكن — والجهات المختصة.',
        en: 'What to watch for with tenancy agreements, deposits and housing benefit, and who is responsible.',
      },
      source: SOURCES.wien,
      steps: [
        {
          title: { de: 'Mietvertrag prüfen lassen', ar: 'مراجعة عقد الإيجار', en: 'Have the tenancy agreement checked' },
          description: {
            de: 'Mietverträge sollten vor der Unterschrift geprüft werden. Mieterschutzorganisationen bieten Beratung an.',
            ar: 'يُنصح بمراجعة عقود الإيجار قبل التوقيع. تقدم منظمات حماية المستأجرين استشارات.',
            en: 'Tenancy agreements should be checked before signing. Tenant protection organisations offer advice.',
          },
          authority: { de: 'Mieterschutzorganisation', ar: 'منظمة حماية المستأجرين', en: 'Tenant protection organisation' },
          timing: { de: 'Vor der Unterschrift', ar: 'قبل التوقيع', en: 'Before signing' },
        },
        {
          title: { de: 'Wohnbeihilfe prüfen', ar: 'التحقق من إعانة السكن', en: 'Check housing benefit' },
          description: {
            de: 'Wohnbeihilfe ist Ländersache — Voraussetzungen und Antragswege unterscheiden sich je nach Bundesland.',
            ar: 'إعانة السكن من اختصاص الولايات — تختلف الشروط وطرق التقديم حسب الولاية.',
            en: 'Housing benefit is handled at provincial level; requirements and application routes differ by state.',
          },
          authority: { de: 'Landesregierung', ar: 'حكومة الولاية', en: 'Provincial government' },
          timing: { de: 'Nach Vertragsabschluss', ar: 'بعد إبرام العقد', en: 'After signing the contract' },
        },
      ],
    },
  ]

  for (const r of roadmaps) {
    const res = await upsert('roadmaps', 'slug', r.slug, {
      title: r.title,
      slug: r.slug,
      icon: r.icon,
      quizMatches: r.quizMatches,
      description: r.description,
      lastReviewedAt: new Date().toISOString(),
      reviewIntervalMonths: 6,
      officialSourceUrl: r.source,
      reviewStatus: 'published',
      steps: r.steps.map((s) => ({
        title: s.title,
        // The sample notice rides on the first field a reader actually reads.
        description: {
          de: `${SAMPLE_NOTICE.de}\n\n${s.description.de}`,
          ar: `${SAMPLE_NOTICE.ar}\n\n${s.description.ar}`,
          en: `${SAMPLE_NOTICE.en}\n\n${s.description.en}`,
        },
        responsibleAuthority: s.authority,
        timing: s.timing,
      })),
    })
    log(r.slug, res)
  }

  // ─── Guide topics + articles ───────────────────────────────────────────────
  console.log('  → Guide topics')
  const topics: Array<{ slug: string; icon: string; order: number; title: L10n; description: L10n }> = [
    { slug: 'wohnen', icon: 'home', order: 1, title: { de: 'Wohnen', ar: 'السكن', en: 'Housing' }, description: { de: 'Mieten, Wohnbeihilfe, Meldezettel.', ar: 'الإيجار وإعانة السكن وشهادة التسجيل.', en: 'Renting, housing benefit, registration.' } },
    { slug: 'arbeit', icon: 'briefcase', order: 2, title: { de: 'Arbeit', ar: 'العمل', en: 'Work' }, description: { de: 'Arbeitssuche, Anerkennung, Arbeitsrecht.', ar: 'البحث عن عمل والاعتراف بالمؤهلات وقانون العمل.', en: 'Job search, recognition, employment law.' } },
    { slug: 'gesundheit', icon: 'heart', order: 3, title: { de: 'Gesundheit', ar: 'الصحة', en: 'Health' }, description: { de: 'Versicherung, Ärzt:innen, Notfälle.', ar: 'التأمين والأطباء والطوارئ.', en: 'Insurance, doctors, emergencies.' } },
    { slug: 'bildung', icon: 'graduation-cap', order: 4, title: { de: 'Bildung', ar: 'التعليم', en: 'Education' }, description: { de: 'Schule, Studium, Deutschkurse.', ar: 'المدرسة والدراسة ودورات اللغة.', en: 'School, university, German courses.' } },
    { slug: 'familie', icon: 'users', order: 5, title: { de: 'Familie', ar: 'الأسرة', en: 'Family' }, description: { de: 'Kinderbetreuung, Beihilfen, Nachzug.', ar: 'رعاية الأطفال والإعانات ولم الشمل.', en: 'Childcare, allowances, family reunification.' } },
    { slug: 'aufenthalt', icon: 'file-text', order: 6, title: { de: 'Aufenthalt', ar: 'الإقامة', en: 'Residence' }, description: { de: 'Aufenthaltstitel, Verlängerung, Staatsbürgerschaft.', ar: 'تصاريح الإقامة والتجديد والجنسية.', en: 'Residence permits, renewal, citizenship.' } },
  ]

  const topicIds: Record<string, string | number> = {}
  for (const t of topics) {
    const res = await upsert('guide-topics', 'slug', t.slug, {
      title: t.title,
      slug: t.slug,
      icon: t.icon,
      order: t.order,
      description: t.description,
    })
    topicIds[t.slug] = res.id
    log(t.slug, res)
  }

  console.log('  → Guide articles')
  const articles: Array<{ slug: string; topic: string; source: string; title: L10n; excerpt: L10n; body: L10n<string[]> }> = [
    {
      slug: 'meldezettel-verstehen',
      topic: 'wohnen',
      source: SOURCES.oesterreichGvAt,
      title: { de: 'Den Meldezettel verstehen', ar: 'فهم شهادة التسجيل', en: 'Understanding the Meldezettel' },
      excerpt: {
        de: 'Was der Meldezettel ist, wofür er gebraucht wird und wo er ausgestellt wird.',
        ar: 'ما هي شهادة التسجيل ولماذا تُستخدم وأين تُصدر.',
        en: 'What the Meldezettel is, what it is needed for and where it is issued.',
      },
      body: {
        de: ['## Wofür der Meldezettel gebraucht wird', 'Die Meldebestätigung wird bei vielen Behördenwegen und Verträgen verlangt — von der Kontoeröffnung bis zur Schulanmeldung.', 'Die genauen Anforderungen entnehmen Sie bitte der verlinkten offiziellen Quelle.'],
        ar: ['## لماذا تُستخدم شهادة التسجيل', 'تُطلب شهادة التسجيل في كثير من المعاملات الرسمية والعقود — من فتح حساب مصرفي إلى تسجيل الأطفال في المدرسة.', 'يرجى مراجعة المصدر الرسمي المرفق للاطلاع على المتطلبات الدقيقة.'],
        en: ['## What the Meldezettel is used for', 'The registration confirmation is required for many official processes and contracts, from opening a bank account to enrolling a child in school.', 'Please see the linked official source for the exact requirements.'],
      },
    },
    {
      slug: 'e-card-und-versicherung',
      topic: 'gesundheit',
      source: SOURCES.oesterreichGvAt,
      title: { de: 'e-card und Krankenversicherung', ar: 'البطاقة الإلكترونية والتأمين الصحي', en: 'The e-card and health insurance' },
      excerpt: {
        de: 'Wie die Krankenversicherung in Österreich grundsätzlich funktioniert und wozu die e-card dient.',
        ar: 'كيف يعمل التأمين الصحي في النمسا بشكل عام وما فائدة البطاقة الإلكترونية.',
        en: 'How health insurance works in Austria in general terms, and what the e-card is for.',
      },
      body: {
        de: ['## Die Grundlagen', 'Die e-card ist der Nachweis der Krankenversicherung und wird bei jedem Arztbesuch vorgelegt.', 'Wer versichert ist und über welchen Träger, hängt von der individuellen Situation ab — die offizielle Quelle erklärt die Zuständigkeiten.'],
        ar: ['## الأساسيات', 'البطاقة الإلكترونية هي إثبات التأمين الصحي وتُقدَّم عند كل زيارة للطبيب.', 'يعتمد التأمين والجهة المؤمِّنة على الوضع الفردي — يوضح المصدر الرسمي الاختصاصات.'],
        en: ['## The basics', 'The e-card is proof of health insurance and is presented at every doctor visit.', 'Who is insured and through which provider depends on individual circumstances; the official source explains responsibilities.'],
      },
    },
    {
      slug: 'zeugnisse-anerkennen-lassen',
      topic: 'arbeit',
      source: SOURCES.oesterreichGvAt,
      title: { de: 'Zeugnisse anerkennen lassen', ar: 'الاعتراف بالشهادات', en: 'Getting qualifications recognised' },
      excerpt: {
        de: 'Warum die Anerkennung ausländischer Abschlüsse für viele Berufe nötig ist.',
        ar: 'لماذا يلزم الاعتراف بالشهادات الأجنبية للعديد من المهن.',
        en: 'Why recognition of foreign qualifications is necessary for many professions.',
      },
      body: {
        de: ['## Bewertung oder Anerkennung', 'Für reglementierte Berufe ist eine formale Anerkennung nötig, für andere reicht oft eine Bewertung.', 'Welche Stelle zuständig ist, richtet sich nach Beruf und Herkunftsland.'],
        ar: ['## التقييم أو الاعتراف', 'تتطلب المهن المنظّمة اعترافاً رسمياً، بينما يكفي التقييم في مهن أخرى.', 'تعتمد الجهة المختصة على المهنة وبلد المنشأ.'],
        en: ['## Assessment or recognition', 'Regulated professions require formal recognition; for others an assessment is often enough.', 'Which body is responsible depends on the profession and country of origin.'],
      },
    },
    {
      slug: 'schulanmeldung',
      topic: 'bildung',
      source: SOURCES.oesterreichGvAt,
      title: { de: 'Kinder in der Schule anmelden', ar: 'تسجيل الأطفال في المدرسة', en: 'Enrolling children in school' },
      excerpt: {
        de: 'Schulpflicht, Anmeldung und wer bei Fragen weiterhilft.',
        ar: 'إلزامية التعليم والتسجيل ومن يساعد في الاستفسارات.',
        en: 'Compulsory schooling, enrolment, and who to ask for help.',
      },
      body: {
        de: ['## Schulpflicht in Österreich', 'In Österreich besteht allgemeine Schulpflicht. Die Anmeldung läuft über die Schule beziehungsweise die Bildungsdirektion.', 'Sprachliche Unterstützung ist in vielen Schulen verfügbar.'],
        ar: ['## إلزامية التعليم في النمسا', 'التعليم إلزامي في النمسا. يتم التسجيل عبر المدرسة أو مديرية التعليم.', 'يتوفر الدعم اللغوي في كثير من المدارس.'],
        en: ['## Compulsory schooling in Austria', 'Schooling is compulsory in Austria. Enrolment goes through the school or the education directorate.', 'Language support is available in many schools.'],
      },
    },
    {
      slug: 'familienbeihilfe',
      topic: 'familie',
      source: SOURCES.oesterreichGvAt,
      title: { de: 'Familienbeihilfe beantragen', ar: 'طلب إعانة الأسرة', en: 'Applying for family allowance' },
      excerpt: {
        de: 'Grundsätzliches zur Familienbeihilfe und wo der Antrag gestellt wird.',
        ar: 'أساسيات إعانة الأسرة وأين يُقدَّم الطلب.',
        en: 'The basics of family allowance and where to apply.',
      },
      body: {
        de: ['## Wer Anspruch hat', 'Die Familienbeihilfe ist an Wohnsitz und Aufenthaltsstatus geknüpft. Die Details regelt das Finanzamt.', 'Bitte prüfen Sie die aktuellen Voraussetzungen über die offizielle Quelle.'],
        ar: ['## من يحق له', 'ترتبط إعانة الأسرة بمحل الإقامة ووضع الإقامة. تنظم دائرة الضرائب التفاصيل.', 'يرجى التحقق من الشروط الحالية عبر المصدر الرسمي.'],
        en: ['## Who is eligible', 'Family allowance depends on residence and residence status. The tax office handles the details.', 'Please check current requirements via the official source.'],
      },
    },
    {
      slug: 'aufenthaltstitel-verlaengern',
      topic: 'aufenthalt',
      source: SOURCES.oesterreichGvAt,
      title: { de: 'Aufenthaltstitel verlängern', ar: 'تجديد تصريح الإقامة', en: 'Renewing a residence permit' },
      excerpt: {
        de: 'Warum die rechtzeitige Verlängerung wichtig ist und wer zuständig ist.',
        ar: 'لماذا يهم التجديد في الوقت المناسب ومن الجهة المختصة.',
        en: 'Why renewing on time matters, and who is responsible.',
      },
      body: {
        de: ['## Rechtzeitig verlängern', 'Anträge auf Verlängerung sollten vor Ablauf des bestehenden Titels gestellt werden.', 'Zuständig ist die jeweilige Niederlassungs- und Aufenthaltsbehörde.'],
        ar: ['## التجديد في الوقت المناسب', 'ينبغي تقديم طلبات التجديد قبل انتهاء صلاحية التصريح الحالي.', 'الجهة المختصة هي سلطة الإقامة والاستقرار المعنية.'],
        en: ['## Renew in good time', 'Renewal applications should be submitted before the current permit expires.', 'The relevant settlement and residence authority is responsible.'],
      },
    },
  ]

  for (const a of articles) {
    const res = await upsert('guide-articles', 'slug', a.slug, {
      title: a.title,
      slug: a.slug,
      topic: topicIds[a.topic],
      excerpt: a.excerpt,
      body: {
        de: richText(SAMPLE_NOTICE.de, ...a.body.de),
        ar: richText(SAMPLE_NOTICE.ar, ...a.body.ar),
        en: richText(SAMPLE_NOTICE.en, ...a.body.en),
      },
      lastReviewedAt: new Date().toISOString(),
      reviewIntervalMonths: 6,
      officialSourceUrl: a.source,
      reviewStatus: 'published',
    })
    log(a.slug, res)
  }

  // ─── Experts ───────────────────────────────────────────────────────────────
  // Fictional people. `consentOnFile` stays false and both contact toggles stay off: no real
  // person consented to anything here, and the collection's whole point is
  // that third-party personal data only goes public with consent on record.
  console.log('  → Experts')
  const experts: Array<{ slug: string; bundesland: string; name: string; city: string; cat: string; langs: string[]; bio: L10n }> = [
    {
      slug: 'beispiel-rechtsberatung',
      bundesland: 'W',
      name: 'A. Muster',
      city: 'Wien',
      cat: 'recht',
      langs: ['Deutsch', 'العربية'],
      bio: { de: 'Rechtsberatung mit Schwerpunkt Aufenthalts- und Arbeitsrecht.', ar: 'استشارات قانونية مع التركيز على قانون الإقامة والعمل.', en: 'Legal advice focusing on residence and employment law.' },
    },
    {
      slug: 'beispiel-steuerberatung',
      bundesland: 'STMK',
      name: 'B. Muster',
      city: 'Graz',
      cat: 'steuern',
      langs: ['Deutsch', 'English'],
      bio: { de: 'Steuerberatung für Selbstständige und kleine Unternehmen.', ar: 'استشارات ضريبية لأصحاب الأعمال الحرة والشركات الصغيرة.', en: 'Tax advice for freelancers and small businesses.' },
    },
    {
      slug: 'beispiel-psychotherapie',
      bundesland: 'OOE',
      name: 'C. Muster',
      city: 'Linz',
      cat: 'gesundheit',
      langs: ['Deutsch', 'العربية'],
      bio: { de: 'Psychotherapie und Beratung, auch in arabischer Sprache.', ar: 'العلاج النفسي والإرشاد، باللغة العربية أيضاً.', en: 'Psychotherapy and counselling, also in Arabic.' },
    },
    {
      slug: 'beispiel-bildungsberatung',
      bundesland: 'SBG',
      name: 'D. Muster',
      city: 'Salzburg',
      cat: 'bildung',
      langs: ['Deutsch', 'English', 'العربية'],
      bio: { de: 'Bildungsberatung: Anerkennung, Studienwahl, Weiterbildung.', ar: 'الإرشاد التعليمي: الاعتراف بالشهادات واختيار الدراسة والتدريب.', en: 'Education guidance: recognition, choosing a course, further training.' },
    },
  ]

  for (const e of experts) {
    const res = await upsert('experts', 'slug', e.slug, {
      name: `${e.name} ${SAMPLE_PERSON.de}`,
      slug: e.slug,
      city: e.city,
      bundesland: e.bundesland,
      categories: cat[e.cat] ? [cat[e.cat]] : undefined,
      languages: e.langs.map((language) => ({ language })),
      bio: {
        de: `${SAMPLE_NOTICE.de}\n\n${e.bio.de}`,
        ar: `${SAMPLE_NOTICE.ar}\n\n${e.bio.ar}`,
        en: `${SAMPLE_NOTICE.en}\n\n${e.bio.en}`,
      },
      showEmail: false,
      showPhone: false,
      consentOnFile: false,
      verificationStatus: 'unverified',
      reviewStatus: 'published',
    })
    log(e.slug, res)
  }

  // ─── Events ────────────────────────────────────────────────────────────────
  console.log('  → Events')
  const events: Array<{ slug: string; inDays: number; cat: string; title: L10n; location: L10n; body: L10n }> = [
    {
      slug: 'beispiel-infoabend-wohnen',
      inDays: 14,
      cat: 'workshop',
      title: { de: 'Infoabend: Wohnen in Österreich', ar: 'أمسية معلوماتية: السكن في النمسا', en: 'Information evening: housing in Austria' },
      location: { de: 'Wien', ar: 'فيينا', en: 'Vienna' },
      body: { de: 'Ein Beispieltermin, damit die Veranstaltungsliste im Entwurf sichtbar ist.', ar: 'موعد تجريبي لإظهار قائمة الفعاليات في المسودة.', en: 'A sample event so the events list is visible in the draft.' },
    },
    {
      slug: 'beispiel-deutsch-stammtisch',
      inDays: 28,
      cat: 'workshop',
      title: { de: 'Deutsch-Stammtisch', ar: 'لقاء المحادثة بالألمانية', en: 'German conversation meetup' },
      location: { de: 'Graz', ar: 'غراتس', en: 'Graz' },
      body: { de: 'Ein Beispieltermin für ein wiederkehrendes Community-Format.', ar: 'موعد تجريبي لفعالية مجتمعية متكررة.', en: 'A sample entry for a recurring community format.' },
    },
    {
      slug: 'beispiel-familienfest',
      inDays: 45,
      cat: 'feier',
      title: { de: 'Familienfest', ar: 'حفل عائلي', en: 'Family celebration' },
      location: { de: 'Linz', ar: 'لينتس', en: 'Linz' },
      body: { de: 'Ein Beispieltermin für ein größeres Vereinsfest.', ar: 'موعد تجريبي لاحتفال أكبر للجمعية.', en: 'A sample entry for a larger association celebration.' },
    },
    {
      slug: 'beispiel-rueckblick-workshop',
      inDays: -21,
      cat: 'workshop',
      title: { de: 'Rückblick: Bewerbungsworkshop', ar: 'استعادة: ورشة التقديم للوظائف', en: 'Past: job application workshop' },
      location: { de: 'Wien', ar: 'فيينا', en: 'Vienna' },
      body: { de: 'Ein vergangener Beispieltermin, damit der "Vergangen"-Tab nicht leer ist.', ar: 'موعد تجريبي سابق حتى لا يكون تبويب «سابقة» فارغاً.', en: 'A past sample event so the "Past" tab is not empty.' },
    },
  ]

  for (const ev of events) {
    const res = await upsert('events', 'slug', ev.slug, {
      title: ev.title,
      slug: ev.slug,
      category: cat[ev.cat],
      startDate: daysFromNow(ev.inDays),
      locationName: ev.location,
      isOnline: false,
      isFree: true,
      description: {
        de: richText(SAMPLE_NOTICE.de, ev.body.de),
        ar: richText(SAMPLE_NOTICE.ar, ev.body.ar),
        en: richText(SAMPLE_NOTICE.en, ev.body.en),
      },
      reviewStatus: 'published',
    })
    log(ev.slug, res)
  }

  // ─── News ──────────────────────────────────────────────────────────────────
  console.log('  → News')
  const news: Array<{ slug: string; daysAgo: number; cat: string; title: L10n; excerpt: L10n }> = [
    { slug: 'beispiel-neue-website', cat: 'vereinsnews', daysAgo: 2, title: { de: 'Die neue SVÖ-Website ist online', ar: 'الموقع الجديد للاتحاد السوري متاح الآن', en: 'The new SVÖ website is live' }, excerpt: { de: 'Ein Beispielbeitrag, damit der Nachrichtenbereich befüllt ist.', ar: 'مقال تجريبي لتعبئة قسم الأخبار.', en: 'A sample post so the news section is populated.' } },
    { slug: 'beispiel-beratung-ausgeweitet', cat: 'vereinsnews', daysAgo: 9, title: { de: 'Beratungsangebot wird ausgeweitet', ar: 'توسيع خدمات الإرشاد', en: 'Advice services are expanding' }, excerpt: { de: 'Ein Beispielbeitrag über ein erweitertes Angebot.', ar: 'مقال تجريبي عن توسيع الخدمات.', en: 'A sample post about an expanded service.' } },
    { slug: 'beispiel-neue-partnerschaft', cat: 'vereinsnews', daysAgo: 17, title: { de: 'Neue Partnerschaft vereinbart', ar: 'اتفاق شراكة جديدة', en: 'New partnership agreed' }, excerpt: { de: 'Ein Beispielbeitrag über eine Kooperation.', ar: 'مقال تجريبي عن تعاون جديد.', en: 'A sample post about a collaboration.' } },
    { slug: 'beispiel-jahresrueckblick', cat: 'vereinsnews', daysAgo: 30, title: { de: 'Jahresrückblick des Vorstands', ar: 'المراجعة السنوية لمجلس الإدارة', en: 'The board looks back on the year' }, excerpt: { de: 'Ein Beispielbeitrag für einen längeren Rückblick.', ar: 'مقال تجريبي لمراجعة أطول.', en: 'A sample post for a longer retrospective.' } },
    { slug: 'beispiel-freiwillige-gesucht', cat: 'vereinsnews', daysAgo: 41, title: { de: 'Freiwillige für Sprachcafés gesucht', ar: 'مطلوب متطوعون لمقاهي اللغة', en: 'Volunteers wanted for language cafés' }, excerpt: { de: 'Ein Beispielbeitrag mit einem Aufruf.', ar: 'مقال تجريبي يتضمن دعوة للمشاركة.', en: 'A sample post containing a call to action.' } },
    { slug: 'beispiel-foerderung-erhalten', cat: 'oesterreich-guide', daysAgo: 55, title: { de: 'Förderung für Jugendarbeit erhalten', ar: 'الحصول على دعم لعمل الشباب', en: 'Funding received for youth work' }, excerpt: { de: 'Ein Beispielbeitrag über eine Förderzusage.', ar: 'مقال تجريبي عن الحصول على تمويل.', en: 'A sample post about a funding award.' } },
  ]

  for (const n of news) {
    const res = await upsert('news', 'slug', n.slug, {
      title: n.title,
      slug: n.slug,
      category: cat[n.cat],
      excerpt: n.excerpt,
      publishedAt: daysFromNow(-n.daysAgo),
      body: {
        de: richText(SAMPLE_NOTICE.de, n.excerpt.de),
        ar: richText(SAMPLE_NOTICE.ar, n.excerpt.ar),
        en: richText(SAMPLE_NOTICE.en, n.excerpt.en),
      },
      reviewStatus: 'published',
    })
    log(n.slug, res)
  }


  // ─── Jobs ──────────────────────────────────────────────────────────────────
  // Expiry dates are set well ahead so the sample postings stay visible during review; the
  // public queries drop anything past its date, so these disappear on their own eventually.
  console.log('  → Jobs')
  const jobs: Array<{
    slug: string
    organisation: string
    city: string
    bundesland: string
    employmentType: string
    expiresInDays: number
    title: L10n
    body: L10n
  }> = [
    {
      slug: 'beispiel-verwaltungsassistenz-wien',
      organisation: 'SVÖ',
      city: 'Wien',
      bundesland: 'W',
      employmentType: 'part_time',
      expiresInDays: 60,
      title: { de: 'Verwaltungsassistenz — Teilzeit', ar: 'مساعد/ة إداري/ة — دوام جزئي', en: 'Administrative assistant — part time' },
      body: {
        de: 'Ein Beispielinserat, damit die Stellenliste im Entwurf sichtbar ist.',
        ar: 'إعلان تجريبي لإظهار قائمة الوظائف في المسودة.',
        en: 'A sample posting so the job list is visible in the draft.',
      },
    },
    {
      slug: 'beispiel-lehrstelle-einzelhandel',
      organisation: 'Beispiel Handel GmbH',
      city: 'Linz',
      bundesland: 'OOE',
      employmentType: 'apprenticeship',
      expiresInDays: 75,
      title: { de: 'Lehrstelle im Einzelhandel', ar: 'تدريب مهني في تجارة التجزئة', en: 'Retail apprenticeship' },
      body: {
        de: 'Ein Beispielinserat für eine Lehrstelle.',
        ar: 'إعلان تجريبي لتدريب مهني.',
        en: 'A sample posting for an apprenticeship.',
      },
    },
    {
      slug: 'beispiel-praktikum-it',
      organisation: 'Beispiel Tech GmbH',
      city: 'Graz',
      bundesland: 'STMK',
      employmentType: 'internship',
      expiresInDays: 90,
      title: { de: 'Praktikum im Bereich IT', ar: 'تدريب في مجال تقنية المعلومات', en: 'Internship in IT' },
      body: {
        de: 'Ein Beispielinserat für ein Praktikum.',
        ar: 'إعلان تجريبي لتدريب عملي.',
        en: 'A sample posting for an internship.',
      },
    },
    {
      slug: 'beispiel-ehrenamt-veranstaltungen',
      organisation: 'SVÖ Salzburg',
      city: 'Salzburg',
      bundesland: 'SBG',
      employmentType: 'volunteer',
      expiresInDays: 120,
      title: { de: 'Ehrenamt: Veranstaltungen mitorganisieren', ar: 'تطوع: المشاركة في تنظيم الفعاليات', en: 'Volunteering: help organise events' },
      body: {
        de: 'Ein Beispielinserat für ein Ehrenamt.',
        ar: 'إعلان تجريبي لفرصة تطوع.',
        en: 'A sample posting for a volunteering role.',
      },
    },
  ]

  for (const j of jobs) {
    const res = await upsert('jobs', 'slug', j.slug, {
      title: j.title,
      slug: j.slug,
      organisation: j.organisation,
      city: j.city,
      bundesland: j.bundesland,
      employmentType: j.employmentType,
      applyUrl: SOURCES.ams,
      publishedAt: daysFromNow(-3),
      expiryDate: daysFromNow(j.expiresInDays),
      description: {
        de: richText(SAMPLE_NOTICE.de, j.body.de),
        ar: richText(SAMPLE_NOTICE.ar, j.body.ar),
        en: richText(SAMPLE_NOTICE.en, j.body.en),
      },
      reviewStatus: 'published',
    })
    log(j.slug, res)
  }

  // ─── Board members ─────────────────────────────────────────────────────────
  console.log('  → Board members')
  const board: Array<{ name: string; order: number; role: L10n }> = [
    { name: 'E. Muster', order: 1, role: { de: 'Obfrau', ar: 'رئيسة', en: 'Chairperson' } },
    { name: 'F. Muster', order: 2, role: { de: 'Obfrau-Stellvertreter', ar: 'نائب الرئيسة', en: 'Deputy chairperson' } },
    { name: 'G. Muster', order: 3, role: { de: 'Kassier', ar: 'أمين الصندوق', en: 'Treasurer' } },
    { name: 'H. Muster', order: 4, role: { de: 'Schriftführerin', ar: 'أمينة السر', en: 'Secretary' } },
  ]

  for (const m of board) {
    const fullName = `${m.name} ${SAMPLE_PERSON.de}`
    const res = await upsert('board-members', 'name', fullName, {
      name: fullName,
      order: m.order,
      role: m.role,
      showEmail: false,
      showLinkedIn: false,
      bio: {
        de: SAMPLE_NOTICE.de,
        ar: SAMPLE_NOTICE.ar,
        en: SAMPLE_NOTICE.en,
      },
    })
    log(fullName, res)
  }

  // ─── Jobs link list (SiteSettings, not a collection) ───────────────────────
  // Real, well-known Austrian job portals — nothing invented. Only written when the board has
  // not curated their own list yet, so a re-run never overwrites their choices.
  console.log('  → Job resource links')
  const settings = await payload.findGlobal({ slug: 'site-settings', locale: 'de', depth: 0, overrideAccess: true })
  const existingLinks = (settings as { jobResourceLinks?: unknown[] })?.jobResourceLinks ?? []
  if (existingLinks.length > 0) {
    console.log('      · already curated, skipped')
  } else {
    const jobLinks = [
      { url: SOURCES.ams, label: { de: 'AMS — Arbeitsmarktservice Österreich', ar: 'AMS — دائرة سوق العمل النمساوية', en: 'AMS — Austrian public employment service' } },
      { url: 'https://www.karriere.at/', label: { de: 'karriere.at — Stellenportal', ar: 'karriere.at — بوابة وظائف', en: 'karriere.at — job portal' } },
      { url: 'https://www.studo.com/jobs', label: { de: 'Studo Jobs — Jobs für Studierende', ar: 'Studo Jobs — وظائف للطلاب', en: 'Studo Jobs — jobs for students' } },
    ]
    const { updateGlobalLocalized } = makeHelpers(payload)
    await updateGlobalLocalized('site-settings', {
      jobResourceLinks: jobLinks.map((l) => ({ url: l.url, label: l.label })),
    })
    console.log(`      + ${jobLinks.length} links`)
  }
}
