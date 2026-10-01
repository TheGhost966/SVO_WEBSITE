/**
 * All user-facing strings for the dashboard guide, in the three languages the admin UI runs in
 * (`i18n.supportedLanguages` in `src/payload.config.ts`). Kept out of `src/messages/*.json`
 * deliberately: those are the *public site's* strings, shipped to every visitor's browser, and
 * this copy is only ever rendered inside `/admin` for a signed-in board member.
 */

export type AdminLang = 'de' | 'ar' | 'en'

export type Copy = {
  greeting: (name: string) => string
  intro: string
  setupHeading: string
  setupIntro: string
  setupAllDone: string
  empty: string
  draftsOnly: string
  ready: string
  addFirst: string
  open: string
  itemsPublished: (published: number, total: number) => string
  placementHeading: string
  placementIntro: string
  colContent: string
  colWhere: string
  workflowHeading: string
  workflowSteps: Array<{ name: string; body: string }>
  workflowRoleBoard: string
  workflowRoleEditor: string
  workflowRoleViewer: string
  gotchaHeading: string
  gotchas: string[]
  globalsHeading: string
  globalsIntro: string
  siteSettings: string
  siteSettingsBody: string
  navigation: string
  navigationBody: string
  viewSite: string
}

const de: Copy = {
  greeting: (name) => `Willkommen, ${name}`,
  intro:
    'Das ist der Redaktionsbereich der SVÖ-Website. Alles, was Besucher:innen auf der Website sehen, wird hier gepflegt — in drei Sprachen (Deutsch, Arabisch, Englisch). Diese Übersicht zeigt Ihnen, womit Sie anfangen können.',

  setupHeading: 'Was noch fehlt',
  setupIntro:
    'Die Startseite blendet jeden Bereich aus, für den es noch keine veröffentlichten Inhalte gibt. Je mehr dieser Punkte gefüllt sind, desto vollständiger wirkt die Website.',
  setupAllDone: 'Alle Inhaltsbereiche sind befüllt. Sehr gut!',
  empty: 'Noch leer',
  draftsOnly: 'Nur Entwürfe',
  ready: 'Veröffentlicht',
  addFirst: 'Ersten Eintrag anlegen',
  open: 'Öffnen',
  itemsPublished: (published, total) => `${published} von ${total} veröffentlicht`,

  placementHeading: 'Wo erscheint was?',
  placementIntro: 'Welcher Inhaltstyp welche Seite der Website füllt.',
  colContent: 'Inhaltstyp',
  colWhere: 'Erscheint auf',

  workflowHeading: 'Der Freigabe-Ablauf',
  workflowSteps: [
    { name: 'Entwurf', body: 'Sie schreiben und speichern. Noch nicht öffentlich sichtbar.' },
    {
      name: 'Zur Überprüfung eingereicht',
      body: 'Der Vorstand wird automatisch per E-Mail benachrichtigt und liest gegen.',
    },
    {
      name: 'Veröffentlicht',
      body: 'Der Beitrag ist auf der Website live und erscheint in den Übersichten.',
    },
    { name: 'Archiviert', body: 'Nicht mehr öffentlich, bleibt aber im System erhalten.' },
  ],
  workflowRoleBoard: 'Ihre Rolle (Vorstand/Administrator) darf Inhalte veröffentlichen und archivieren.',
  workflowRoleEditor:
    'Ihre Rolle (Redakteur:in) darf Inhalte anlegen und bearbeiten. Zum Veröffentlichen setzen Sie den Status auf "Zur Überprüfung eingereicht" — der Vorstand gibt frei.',
  workflowRoleViewer: 'Ihre Rolle (Betrachter:in) hat nur Lesezugriff.',

  gotchaHeading: 'Gut zu wissen',
  gotchas: [
    'Ein Beitrag ist erst öffentlich sichtbar, wenn der Status auf "Veröffentlicht" steht — Speichern allein genügt nicht.',
    'Jeder Text kann pro Sprache gepflegt werden. Fehlt die arabische oder englische Fassung, zeigt die Website automatisch die deutsche.',
    'Ein Guide-Thema erscheint erst auf der Website, wenn mindestens ein veröffentlichter Artikel darin liegt. Leere Themen bleiben unsichtbar.',
    'Die Startseite blendet leere Bereiche komplett aus. Eine kurze Startseite bedeutet meistens: es fehlen noch Inhalte, nicht dass etwas kaputt ist.',
    'Stellenangebote sind keine eigene Sammlung, sondern eine gepflegte Linkliste in den Website-Einstellungen.',
  ],

  globalsHeading: 'Website-weite Einstellungen',
  globalsIntro: 'Diese beiden Bereiche wirken sich auf jede Seite aus.',
  siteSettings: 'Website-Einstellungen',
  siteSettingsBody:
    'Vereinsname, Kontaktdaten, Startseiten-Texte (Hero, Hilfe-Karten, CTA-Band), Reihenfolge der Startseiten-Bereiche, Link-Liste für Stellenangebote und die SEO-Standardtexte.',
  navigation: 'Navigation',
  navigationBody: 'Die Menüpunkte in Kopf- und Fußzeile.',
  viewSite: 'Website ansehen',
}

const en: Copy = {
  greeting: (name) => `Welcome, ${name}`,
  intro:
    'This is the editorial area of the SVÖ website. Everything visitors see on the website is maintained here, in three languages (German, Arabic, English). This overview shows you where to start.',

  setupHeading: 'What is still missing',
  setupIntro:
    'The homepage hides any section that has no published content yet. The more of these are filled in, the more complete the site looks.',
  setupAllDone: 'Every content area has published content. Nicely done.',
  empty: 'Still empty',
  draftsOnly: 'Drafts only',
  ready: 'Published',
  addFirst: 'Create the first entry',
  open: 'Open',
  itemsPublished: (published, total) => `${published} of ${total} published`,

  placementHeading: 'Where does what appear?',
  placementIntro: 'Which content type fills which page of the website.',
  colContent: 'Content type',
  colWhere: 'Appears on',

  workflowHeading: 'The review workflow',
  workflowSteps: [
    { name: 'Draft', body: 'You write and save. Not publicly visible yet.' },
    { name: 'In review', body: 'The board is notified by email automatically and reviews it.' },
    {
      name: 'Published',
      body: 'The entry is live on the website and shows up in the listings.',
    },
    { name: 'Archived', body: 'No longer public, but kept in the system.' },
  ],
  workflowRoleBoard: 'Your role (board/admin) can publish and archive content.',
  workflowRoleEditor:
    'Your role (editor) can create and edit content. To get something published, set the status to "In review" — the board approves it.',
  workflowRoleViewer: 'Your role (viewer) has read-only access.',

  gotchaHeading: 'Good to know',
  gotchas: [
    'An entry only becomes publicly visible once its status is "Published" — saving alone is not enough.',
    'Every text can be maintained per language. If the Arabic or English version is missing, the site falls back to German automatically.',
    'A guide topic only appears on the website once it contains at least one published article. Empty topics stay hidden.',
    'The homepage hides empty sections entirely. A short homepage usually means content is still missing, not that something is broken.',
    'Jobs are not a collection of their own — they are a curated list of links in the website settings.',
  ],

  globalsHeading: 'Site-wide settings',
  globalsIntro: 'These two areas affect every page.',
  siteSettings: 'Website settings',
  siteSettingsBody:
    'Association name, contact details, homepage copy (hero, help cards, CTA band), homepage section order, the jobs link list, and the SEO defaults.',
  navigation: 'Navigation',
  navigationBody: 'The menu entries in the header and footer.',
  viewSite: 'View website',
}

const ar: Copy = {
  greeting: (name) => `أهلاً بك، ${name}`,
  intro:
    'هذه منطقة التحرير لموقع الاتحاد السوري في النمسا. كل ما يراه الزوّار على الموقع يُدار من هنا، بثلاث لغات (الألمانية والعربية والإنجليزية). تعرض لك هذه الصفحة من أين تبدأ.',

  setupHeading: 'ما الذي ما زال ناقصاً',
  setupIntro:
    'تُخفي الصفحة الرئيسية أي قسم لا يحتوي على محتوى منشور. كلما امتلأت هذه العناصر، بدا الموقع أكثر اكتمالاً.',
  setupAllDone: 'جميع أقسام المحتوى ممتلئة. عمل ممتاز.',
  empty: 'فارغ',
  draftsOnly: 'مسودات فقط',
  ready: 'منشور',
  addFirst: 'أضف أول مُدخل',
  open: 'فتح',
  itemsPublished: (published, total) => `${published} من ${total} منشور`,

  placementHeading: 'أين يظهر كل شيء؟',
  placementIntro: 'أي نوع من المحتوى يملأ أي صفحة في الموقع.',
  colContent: 'نوع المحتوى',
  colWhere: 'يظهر في',

  workflowHeading: 'مسار المراجعة',
  workflowSteps: [
    { name: 'مسودة', body: 'تكتب وتحفظ. غير مرئي للجمهور بعد.' },
    { name: 'قيد المراجعة', body: 'يُبلَّغ مجلس الإدارة تلقائياً بالبريد الإلكتروني ويقوم بالمراجعة.' },
    { name: 'منشور', body: 'المُدخل منشور على الموقع ويظهر في القوائم.' },
    { name: 'مؤرشف', body: 'لم يعد ظاهراً للجمهور، لكنه محفوظ في النظام.' },
  ],
  workflowRoleBoard: 'دورك (مجلس الإدارة/مدير) يسمح بالنشر والأرشفة.',
  workflowRoleEditor:
    'دورك (محرر) يسمح بإنشاء المحتوى وتعديله. للنشر، اضبط الحالة على «قيد المراجعة» — ومجلس الإدارة يوافق.',
  workflowRoleViewer: 'دورك (مشاهد) للقراءة فقط.',

  gotchaHeading: 'معلومات مفيدة',
  gotchas: [
    'لا يظهر المُدخل للجمهور إلا عندما تكون حالته «منشور» — الحفظ وحده لا يكفي.',
    'يمكن تحرير كل نص لكل لغة على حدة. إذا كانت النسخة العربية أو الإنجليزية ناقصة، يعرض الموقع النسخة الألمانية تلقائياً.',
    'لا يظهر موضوع الدليل على الموقع إلا إذا احتوى على مقال منشور واحد على الأقل. المواضيع الفارغة تبقى مخفية.',
    'تُخفي الصفحة الرئيسية الأقسام الفارغة تماماً. الصفحة الرئيسية القصيرة تعني غالباً نقص المحتوى، لا وجود عطل.',
    'فرص العمل ليست مجموعة مستقلة، بل قائمة روابط منسّقة ضمن إعدادات الموقع.',
  ],

  globalsHeading: 'إعدادات عامة للموقع',
  globalsIntro: 'يؤثر هذان القسمان على كل صفحة.',
  siteSettings: 'إعدادات الموقع',
  siteSettingsBody:
    'اسم الجمعية، بيانات الاتصال، نصوص الصفحة الرئيسية (الواجهة، بطاقات المساعدة، شريط الدعوة)، ترتيب أقسام الصفحة الرئيسية، قائمة روابط فرص العمل، وإعدادات SEO الافتراضية.',
  navigation: 'التنقل',
  navigationBody: 'عناصر القائمة في الترويسة والتذييل.',
  viewSite: 'عرض الموقع',
}

export const COPY: Record<AdminLang, Copy> = { de, ar, en }

export function resolveLang(language: string | undefined): AdminLang {
  return language === 'ar' || language === 'en' ? language : 'de'
}
