/**
 * Copy for the Figma-fidelity homepage (client's "SVÖ Website – AR-EN Concept" frames).
 *
 * Arabic hero headline/subline are lifted verbatim from the Figma frame (`design/figma-homepage-exports/1.png`);
 * every other string — and all of de/en — is agent-authored to fit those frames and is placeholder
 * copy pending board sign-off (CONTENT-NEEDED.md "Home page"). Deliberately omitted from the Figma
 * because nothing real backs them: "+1,200 members", "+250 experts", "reply within 48 h", "+40 articles",
 * QR check-in / seat counts, personalised roadmap progress, login/join buttons, app-store badges.
 */
export type HomeCopy = {
  heroBadge: string
  heroHeadline: string
  heroSubline: string
  searchPlaceholder: string
  searchCta: string
  chips: Array<{ label: string; href: string; active?: boolean }>
  exampleRoadmap: string
  exampleRoadmapCta: string
  stepsCount: (n: number) => string
  moreSteps: string
  startRoadmap: string
  eyebrow: {
    help: string
    roadmaps: string
    guide: string
    experts: string
    jobs: string
    events: string
    news: string
  }
  helpHeading: string
  helpSubtitle: string
  helpCards: Array<{ title: string; description: string; href: string; icon: string; dark?: boolean }>
  roadmapsSubtitle: string
  guideSubtitle: string
  expertsSubtitle: string
  jobsSubtitle: string
  eventsSubtitle: string
  newsSubtitle: string
  viewProfile: string
  verified: string
  jobsCta: string
  readMore: string
  details: string
  free: string
  online: string
  expertCta: { heading: string; body: string; button: string }
  twin: {
    volunteer: { heading: string; body: string; button: string }
    idea: { heading: string; body: string; button: string }
  }
  /** Figma 3.png's green band under the roadmap cards. */
  quiz: { heading: string; body: string; button: string }
  /**
   * Figma 10.png. The frame shows App Store and Google Play buttons; no app exists, so this
   * copy announces one in preparation and the section links to the contact form instead of
   * two dead store badges.
   */
}

export const HOME_COPY: Record<string, HomeCopy> = {
  de: {
    heroBadge: 'SVÖ · Syrischer Verband in Österreich',
    heroHeadline: 'Alles, was Sie für das Leben in Österreich brauchen – an einem Ort.',
    heroSubline:
      'Sie müssen das österreichische System nicht vorab kennen. Sagen Sie uns, wie Ihre Situation aussieht – wir führen Sie Schritt für Schritt zur richtigen Information, zur zuständigen Stelle und zur passenden Person.',
    searchPlaceholder: 'Suche nach Job, Wohnung, Deutschkurs, Expert:in …',
    searchCta: 'Suchen',
    chips: [
      { label: 'Ich weiß nicht, wo ich anfangen soll', href: '/roadmaps', active: true },
      { label: 'Ich brauche Hilfe', href: '/contact' },
      { label: 'Ich suche Arbeit', href: '/jobs' },
      { label: 'Ich suche Expert:innen', href: '/experts' },
      { label: 'Ich möchte studieren', href: '/guide' },
    ],
    exampleRoadmap: 'Beispiel-Anleitung',
    exampleRoadmapCta: 'Anleitung ansehen',
    stepsCount: (n) => `${n} ${n === 1 ? 'Schritt' : 'Schritte'}`,
    moreSteps: 'weitere Schritte …',
    startRoadmap: 'Anleitung starten',
    eyebrow: {
      help: 'HIER STARTEN',
      roadmaps: 'ANLEITUNGEN',
      guide: 'ÖSTERREICH-GUIDE',
      experts: 'EXPERT:INNEN-NETZWERK',
      jobs: 'JOBS & CHANCEN',
      events: 'VERANSTALTUNGEN',
      news: 'NACHRICHTEN',
    },
    helpHeading: 'Wie können wir Ihnen heute helfen?',
    helpSubtitle: 'Wählen Sie, was zu Ihrer Situation passt – wir führen Sie zur Anleitung, zur Information und zur richtigen Stelle, ohne dass Sie selbst suchen müssen.',
    helpCards: [
      { title: 'Ich weiß nicht, wo ich anfangen soll', description: 'Wählen Sie Ihre Situation – die Anleitungen führen Sie Schritt für Schritt durch alles Nötige.', href: '/roadmaps', icon: 'compass', dark: true },
      { title: 'Ich brauche Hilfe', description: 'Schreiben Sie uns Ihr Anliegen – der Verband meldet sich bei Ihnen.', href: '/contact', icon: 'help-circle' },
      { title: 'Ich suche eine Expertin / einen Experten', description: 'Verzeichnis von Fachleuten der syrischen Community in Österreich – Recht, Übersetzung, Steuern und mehr.', href: '/experts', icon: 'users' },
      { title: 'Leben in Österreich', description: 'Arbeit, Wohnen, Gesundheit, Bildung, Familie – verständlich erklärt, mit Verweis auf die zuständige Stelle.', href: '/guide', icon: 'book-open' },
    ],
    roadmapsSubtitle: 'Jede Anleitung ist eine Abfolge klarer Schritte: kurz erklärt, mit der zuständigen Stelle und dem offiziellen Link.',
    guideSubtitle: 'Jedes Thema kurz erklärt: Was ist das, wann brauchen Sie es, was ist zu tun – und wo finden Sie die zuständige Stelle.',
    expertsSubtitle: 'Suchen nach Fachgebiet, Region und Sprache. Jedes Profil wird vor der Veröffentlichung vom Verband geprüft; Kontaktdaten erscheinen nur mit Einwilligung.',
    jobsSubtitle: 'Stellen, Ausbildung, Kurse und Freiwilligenarbeit – kuratierte Links zu vertrauenswürdigen Quellen.',
    eventsSubtitle: 'Ausflüge, Kurse, Workshops, Sport und Kultur – alle Veranstaltungen der Community auf einen Blick.',
    newsSubtitle: 'Neuigkeiten des Verbands, wichtige Ankündigungen und Inhalte passend zu Ihrer Situation.',
    viewProfile: 'Profil ansehen',
    verified: 'Verifiziert',
    jobsCta: 'Zum Angebot',
    readMore: 'Weiterlesen',
    details: 'Details ansehen',
    free: 'Kostenlos',
    online: 'Online',
    expertCta: {
      heading: 'Sie sind Expert:in in Ihrem Fachgebiet? Treten Sie dem Netzwerk bei',
      body: 'Füllen Sie das Formular aus – die Verwaltung prüft Ihren Eintrag, bevor er öffentlich erscheint.',
      button: 'Als Expert:in eintragen',
    },
    twin: {
      volunteer: {
        heading: 'Werden Sie Freiwillige:r',
        body: 'Veranstaltungen organisieren, übersetzen, unterrichten, fotografieren, IT, Beratung – Ihre Zeit macht einen Unterschied.',
        button: 'Als Freiwillige:r melden',
      },
      idea: {
        heading: 'Ich habe eine Idee',
        body: 'Sie haben eine Idee, die der Community hilft? Schreiben Sie uns: das Problem, die Lösung und wer davon profitiert.',
        button: 'Idee teilen',
      },
    },
    quiz: {
      heading: 'Was ist meine Situation? — nur vier Fragen',
      body: 'Wo leben Sie? Wie sieht Ihre Situation aus? Wie gut sprechen Sie Deutsch? Was möchten Sie erreichen? — wir schlagen Ihnen sofort die passenden Anleitungen vor.',
      button: 'Fragen beantworten',
    },
  },
  ar: {
    heroBadge: 'الاتحاد السوري في النمسا · SVÖ',
    heroHeadline: 'كل ما تحتاجه للحياة في النمسا، في مكان واحد.',
    heroSubline:
      'لا حاجة لأن تعرف النظام النمساوي مسبقًا. قل لنا ما وضعك — ونحن نرشدك خطوة بخطوة إلى المعلومة الصحيحة، والجهة المختصة، والشخص المناسب.',
    searchPlaceholder: 'ابحث عن عمل، سكن، دورة لغة، خبير…',
    searchCta: 'ابحث',
    chips: [
      { label: 'ما بعرف من وين أبدأ', href: '/roadmaps', active: true },
      { label: 'أحتاج مساعدة', href: '/contact' },
      { label: 'أبحث عن عمل', href: '/jobs' },
      { label: 'أبحث عن خبير', href: '/experts' },
      { label: 'أريد الدراسة', href: '/guide' },
    ],
    exampleRoadmap: 'مثال على مسار',
    exampleRoadmapCta: 'عرض المسار',
    stepsCount: (n) => `${n} ${n === 1 ? 'خطوة' : 'خطوات'}`,
    moreSteps: 'وخطوات أخرى…',
    startRoadmap: 'ابدأ المسار',
    eyebrow: {
      help: 'ابدأ من هنا',
      roadmaps: 'المسارات',
      guide: 'دليل النمسا',
      experts: 'شبكة الخبراء',
      jobs: 'الوظائف والفرص',
      events: 'الفعاليات',
      news: 'الأخبار',
    },
    helpHeading: 'كيف يمكننا مساعدتك اليوم؟',
    helpSubtitle: 'اختر ما يناسب وضعك — نقودك إلى المسار والمعلومة والجهة الصحيحة دون أن تبحث بنفسك.',
    helpCards: [
      { title: 'ما بعرف من وين أبدأ', description: 'اختر وضعك — والمسارات ترشدك خطوة بخطوة إلى كل ما تحتاجه.', href: '/roadmaps', icon: 'compass', dark: true },
      { title: 'أحتاج مساعدة', description: 'أرسل لنا طلبك — والاتحاد يتواصل معك.', href: '/contact', icon: 'help-circle' },
      { title: 'أبحث عن خبير', description: 'دليل بأصحاب الاختصاص من الجالية السورية في النمسا — قانون، ترجمة، ضرائب وغيرها.', href: '/experts', icon: 'users' },
      { title: 'دليل الحياة في النمسا', description: 'عمل، سكن، صحة، تعليم، أسرة — مشروح بلغة واضحة ومرتبط بالجهة الرسمية.', href: '/guide', icon: 'book-open' },
    ],
    roadmapsSubtitle: 'كل مسار سلسلة خطوات مرتبة: شرح قصير، الجهة المختصة، والرابط الرسمي.',
    guideSubtitle: 'كل موضوع باختصار: ما هو؟ متى تحتاجه؟ ماذا تفعل؟ وأين الجهة المختصة.',
    expertsSubtitle: 'ابحث حسب الاختصاص والولاية واللغة. كل ملف يُراجع من الاتحاد قبل النشر، ووسائل التواصل تظهر بموافقة الشخص فقط.',
    jobsSubtitle: 'وظائف، تدريب، دورات، وفرص تطوع — روابط منتقاة إلى مصادر موثوقة.',
    eventsSubtitle: 'رحلات، دورات، ورشات، رياضة وثقافة — كل فعاليات الجالية في مكان واحد.',
    newsSubtitle: 'أخبار الاتحاد، إعلانات مهمة، ومحتوى يناسب وضعك.',
    viewProfile: 'عرض الملف',
    verified: 'موثّق',
    jobsCta: 'اذهب إلى العرض',
    readMore: 'اقرأ المزيد',
    details: 'عرض التفاصيل',
    free: 'مجاني',
    online: 'عبر الإنترنت',
    expertCta: {
      heading: 'أنت خبير في مجالك؟ انضم إلى الشبكة',
      body: 'املأ الطلب — تُراجعه الإدارة قبل الظهور للعامة.',
      button: 'سجّل كخبير',
    },
    twin: {
      volunteer: {
        heading: 'كن متطوعًا',
        body: 'تنظيم فعاليات، ترجمة، تعليم، تصوير، IT، إرشاد — وقتك يصنع فرقًا.',
        button: 'سجّل كمتطوع',
      },
      idea: {
        heading: 'عندي فكرة',
        body: 'عندك فكرة تخدم الجالية؟ أرسلها: المشكلة التي تحلها، الحل المقترح، والمستفيدون.',
        button: 'شارك فكرتك',
      },
    },
    quiz: {
      heading: 'ما هو وضعي؟ — أربعة أسئلة فقط',
      body: 'أين تعيش؟ ما وضعك الحالي؟ ما مستوى لغتك الألمانية؟ ما الذي تريد تحقيقه؟ — وسنقترح عليك المسارات المناسبة فوراً.',
      button: 'ابدأ الأسئلة',
    },
  },
  en: {
    heroBadge: 'SVÖ · Syrian Association in Austria',
    heroHeadline: 'Everything you need for life in Austria, in one place.',
    heroSubline:
      "You don't need to know the Austrian system in advance. Tell us your situation — we guide you step by step to the right information, the responsible office and the right person.",
    searchPlaceholder: 'Search for a job, housing, a language course, an expert …',
    searchCta: 'Search',
    chips: [
      { label: "I don't know where to start", href: '/roadmaps', active: true },
      { label: 'I need help', href: '/contact' },
      { label: "I'm looking for a job", href: '/jobs' },
      { label: 'Find an expert', href: '/experts' },
      { label: 'I want to study', href: '/guide' },
    ],
    exampleRoadmap: 'Example roadmap',
    exampleRoadmapCta: 'View roadmap',
    stepsCount: (n) => `${n} ${n === 1 ? 'step' : 'steps'}`,
    moreSteps: 'more steps …',
    startRoadmap: 'Start roadmap',
    eyebrow: {
      help: 'START HERE',
      roadmaps: 'ROADMAPS',
      guide: 'AUSTRIA GUIDE',
      experts: 'EXPERTS NETWORK',
      jobs: 'JOBS & OPPORTUNITIES',
      events: 'EVENTS',
      news: 'NEWS',
    },
    helpHeading: 'How can we help you today?',
    helpSubtitle: 'Pick what fits your situation — we take you to the right roadmap, information and office so you do not have to search on your own.',
    helpCards: [
      { title: "I don't know where to start", description: 'Choose your situation — the roadmaps walk you step by step through everything you need.', href: '/roadmaps', icon: 'compass', dark: true },
      { title: 'I need help', description: 'Send us your request — the association will get back to you.', href: '/contact', icon: 'help-circle' },
      { title: 'Find an expert', description: 'A directory of professionals from the Syrian community in Austria — law, translation, tax and more.', href: '/experts', icon: 'users' },
      { title: 'Life in Austria', description: 'Work, housing, health, education, family — explained clearly, with a pointer to the responsible office.', href: '/guide', icon: 'book-open' },
    ],
    roadmapsSubtitle: 'Every roadmap is a sequence of clear steps: a short explanation, the responsible office and the official link.',
    guideSubtitle: 'Each topic in brief: what is it, when do you need it, what to do — and where to find the responsible office.',
    expertsSubtitle: 'Search by field, region and language. Every profile is reviewed by the association before publication; contact details appear only with consent.',
    jobsSubtitle: 'Jobs, training, courses and volunteering — curated links to trusted sources.',
    eventsSubtitle: 'Trips, courses, workshops, sport and culture — all community events at a glance.',
    newsSubtitle: 'Association news, important announcements and content that fits your situation.',
    viewProfile: 'View profile',
    verified: 'Verified',
    jobsCta: 'Go to listing',
    readMore: 'Read more',
    details: 'View details',
    free: 'Free',
    online: 'Online',
    expertCta: {
      heading: 'An expert in your field? Join the network',
      body: 'Fill in the form — the administration reviews your entry before it appears publicly.',
      button: 'Register as an expert',
    },
    twin: {
      volunteer: {
        heading: 'Become a volunteer',
        body: 'Organising events, translating, teaching, photography, IT, guidance — your time makes a difference.',
        button: 'Sign up as a volunteer',
      },
      idea: {
        heading: 'I have an idea',
        body: 'Got an idea that helps the community? Send it in: the problem it solves, the proposed solution and who benefits.',
        button: 'Share your idea',
      },
    },
    quiz: {
      heading: 'What is my situation? — just four questions',
      body: 'Where do you live? What is your situation? How is your German? What do you want to achieve? — we will suggest the right roadmaps straight away.',
      button: 'Answer the questions',
    },
  },
}

export function homeCopy(locale: string): HomeCopy {
  return HOME_COPY[locale] ?? HOME_COPY.de
}
