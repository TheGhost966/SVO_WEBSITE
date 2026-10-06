import type { CollectionConfig, Field, GlobalConfig, Tab } from 'payload'
import { ar } from '@/lib/adminHelp/ar'
import { en } from '@/lib/adminHelp/en'

/**
 * How the admin panel is laid out for the people who use it: three to five volunteers at
 * intermediate skill, working in German, Arabic or English (questionnaire §12.4, §15.2).
 *
 * Everything here is presentation — labels, help texts, sidebar groups, list columns, tabs. No
 * field is added, removed or renamed, and the tabs are UNNAMED: an unnamed tab groups fields on
 * screen and leaves the data shape (and the database schema) exactly as it was. A named tab would
 * nest its fields under the tab's name.
 *
 * It lives in one file, applied in payload.config.ts, rather than in sixteen collection files: the
 * collections stay about data, access and hooks, and a wording or ordering change is made here.
 *
 * The help texts below are the German ones. Their Arabic and English versions are in
 * src/lib/adminHelp/ — the `AdminHelp` type makes a missing translation a type error.
 */

type Trans = { de: string; ar: string; en: string }

// ─── Sidebar groups, in the order they appear (most used first) ──────────────

const GROUPS = {
  content: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
  inbox: { de: 'Anfragen', ar: 'الطلبات', en: 'Inbox' },
  structure: { de: 'Struktur', ar: 'الهيكل', en: 'Structure' },
  association: { de: 'Verein', ar: 'الجمعية', en: 'Association' },
  settings: { de: 'Einstellungen', ar: 'الإعدادات', en: 'Settings' },
} satisfies Record<string, Trans>

const TAB = {
  content: { de: 'Inhalt', ar: 'المحتوى', en: 'Content' },
  seo: { de: 'SEO', ar: 'SEO', en: 'SEO' },
  settings: { de: 'Einstellungen', ar: 'الإعدادات', en: 'Settings' },
  general: { de: 'Allgemein', ar: 'عام', en: 'General' },
  home: { de: 'Startseite', ar: 'الصفحة الرئيسية', en: 'Homepage' },
  jobs: { de: 'Stellenangebote', ar: 'فرص العمل', en: 'Jobs' },
} satisfies Record<string, Trans>

type Layout = {
  labels: { singular: Trans; plural: Trans }
  group: Trans
  /** List columns: what it is, its status, when it last changed. */
  columns: string[]
  /** Top-level fields shown on the "Einstellungen" tab. A collection without this has no tabs. */
  settings?: string[]
  /** Only board and admin may change these; for everyone else they are not in the sidebar. */
  boardOnly?: boolean
  /** German help texts by field path (`steps.title` for a field inside the `steps` array). Translations: src/lib/adminHelp/. */
  help: Record<string, string>
}

const SLUG_HELP = 'Teil der Web-Adresse. Nur Kleinbuchstaben, Ziffern und Bindestriche, z. B. „deutschkurs-wien“. Nach der Veröffentlichung nicht mehr ändern — alte Links führen sonst ins Leere.'
const STATUS_HELP = 'Entscheidet, ob der Eintrag auf der Website steht. Redaktion: „Entwurf“ oder „Zur Überprüfung“. Veröffentlichen und Archivieren kann nur der Vorstand.'
const BUNDESLAND_HELP = 'Nur ausfüllen, wenn der Eintrag ein bestimmtes Bundesland betrifft.'
const ORDER_HELP = 'Kleinere Zahl = weiter vorne.'
const ICON_HELP = 'Name eines Symbols von lucide.dev, z. B. „home“ oder „briefcase“. Leer lassen für das Standardsymbol.'
const LAST_REVIEWED_HELP = 'Wird auf der Seite als „Stand: TT.MM.JJJJ“ angezeigt. Nach jeder inhaltlichen Prüfung neu setzen.'
const INTERVAL_HELP = 'Nach so vielen Monaten erscheint der Eintrag auf der Startseite des Admin-Bereichs unter „Prüfung überfällig“.'
const SOURCE_HELP = 'Link zur amtlichen Quelle, z. B. oesterreich.gv.at. Wird unter dem Text angezeigt.'

const LAYOUT = {
  news: {
    labels: { singular: { de: 'News-Artikel', ar: 'خبر', en: 'News article' }, plural: { de: 'News', ar: 'الأخبار', en: 'News' } },
    group: GROUPS.content,
    columns: ['title', 'reviewStatus', 'publishedAt', 'updatedAt'],
    settings: ['slug', 'publishedAt', 'author', 'bundesland', 'featured'],
    help: {
      title: 'Überschrift des Artikels. Für jede Sprache einzeln eintragen (Sprachumschalter oben).',
      slug: SLUG_HELP,
      excerpt: 'Zwei bis drei Sätze, höchstens 200 Zeichen. Erscheint in der Übersicht und in Suchmaschinen.',
      body: 'Der Artikeltext.',
      coverImage: 'Bild über dem Artikel und in der Übersicht. Querformat, mindestens 1200 Pixel breit.',
      category: 'Ordnet den Artikel einer Rubrik zu. Besucher:innen können danach filtern.',
      author: 'Name, der beim Artikel steht. Leer lassen, wenn kein Name genannt werden soll.',
      publishedAt: 'Datum, das beim Artikel steht und die Reihenfolge bestimmt. Leer = heute.',
      bundesland: BUNDESLAND_HELP,
      featured: 'Hervorgehobene Artikel stehen in der News-Übersicht ganz oben.',
      reviewStatus: STATUS_HELP,
    },
  },
  events: {
    labels: { singular: { de: 'Veranstaltung', ar: 'فعالية', en: 'Event' }, plural: { de: 'Veranstaltungen', ar: 'الفعاليات', en: 'Events' } },
    group: GROUPS.content,
    columns: ['title', 'reviewStatus', 'startDate', 'updatedAt'],
    settings: ['slug', 'bundesland', 'registrationUrl', 'capacity', 'isFree'],
    help: {
      title: 'Name der Veranstaltung. Für jede Sprache einzeln eintragen.',
      slug: SLUG_HELP,
      description: 'Was passiert, für wen ist es gedacht, was ist mitzubringen.',
      coverImage: 'Bild zur Veranstaltung. Querformat.',
      category: 'Art der Veranstaltung. Besucher:innen können danach filtern.',
      startDate: 'Datum und Uhrzeit des Beginns. Nach diesem Zeitpunkt wandert die Veranstaltung zu „Vergangene“.',
      endDate: 'Optional. Leer lassen, wenn es kein festes Ende gibt.',
      locationName: 'Name des Ortes, z. B. „Volkshochschule Ottakring“.',
      address: 'Straße, Hausnummer, PLZ, Ort.',
      bundesland: BUNDESLAND_HELP,
      isOnline: 'Ankreuzen, wenn die Veranstaltung online stattfindet. Ort und Adresse können dann leer bleiben.',
      registrationUrl: 'Vollständige Adresse (https://…) der Anmeldeseite. Die Website zeigt nur diesen Link — sie nimmt selbst keine Anmeldungen entgegen.',
      capacity: 'Anzahl der Plätze. Wird nur angezeigt, nicht mitgezählt.',
      isFree: 'Ankreuzen, wenn die Teilnahme nichts kostet.',
      reviewStatus: STATUS_HELP,
    },
  },
  'guide-articles': {
    labels: { singular: { de: 'Guide-Artikel', ar: 'مقال الدليل', en: 'Guide article' }, plural: { de: 'Guide-Artikel', ar: 'مقالات الدليل', en: 'Guide articles' } },
    group: GROUPS.content,
    columns: ['title', 'reviewStatus', 'topic', 'lastReviewedAt', 'updatedAt'],
    settings: ['slug', 'lastReviewedAt', 'reviewIntervalMonths', 'officialSourceUrl'],
    help: {
      title: 'Überschrift des Artikels. Für jede Sprache einzeln eintragen.',
      slug: SLUG_HELP,
      topic: 'Das Thema des Österreich-Guides, unter dem der Artikel erscheint.',
      excerpt: 'Ein bis zwei Sätze für die Übersicht.',
      body: 'Der Artikeltext. Schritte und Fristen möglichst als Liste.',
      coverImage: 'Optionales Bild über dem Artikel.',
      lastReviewedAt: LAST_REVIEWED_HELP,
      reviewIntervalMonths: INTERVAL_HELP,
      officialSourceUrl: SOURCE_HELP,
      relatedServices: 'Leistungen des Vereins, die zu diesem Artikel passen. Erscheinen unter dem Text als „Passend dazu“.',
      relatedRoadmaps: 'Wegweiser, die zu diesem Artikel passen. Erscheinen unter dem Text als „Passend dazu“.',
      relatedExperts: 'Expert:innen, die zu diesem Thema beraten. Erscheinen unter dem Text als „Passend dazu“.',
      reviewStatus: STATUS_HELP,
    },
  },
  roadmaps: {
    labels: { singular: { de: 'Wegweiser', ar: 'خارطة طريق', en: 'Roadmap' }, plural: { de: 'Wegweiser', ar: 'خرائط الطريق', en: 'Roadmaps' } },
    group: GROUPS.content,
    columns: ['title', 'reviewStatus', 'lastReviewedAt', 'updatedAt'],
    settings: ['slug', 'icon', 'quizMatches', 'lastReviewedAt', 'reviewIntervalMonths', 'officialSourceUrl'],
    help: {
      title: 'Name des Wegweisers, z. B. „Ankommen und anmelden“. Für jede Sprache einzeln eintragen.',
      slug: SLUG_HELP,
      description: 'Ein bis zwei Sätze: für wen ist dieser Wegweiser, was ist am Ende erledigt.',
      icon: ICON_HELP,
      quizMatches: 'Für welche Situationen ist dieser Wegweiser die richtige Antwort? Das Quiz „Was ist meine Situation?“ wird erst angeboten, wenn jede mögliche Antwort zu mindestens einem veröffentlichten Wegweiser führt.',
      lastReviewedAt: LAST_REVIEWED_HELP,
      reviewIntervalMonths: INTERVAL_HELP,
      officialSourceUrl: SOURCE_HELP,
      steps: 'Die Schritte in der Reihenfolge, in der sie zu erledigen sind. Zeilen lassen sich verschieben.',
      'steps.title': 'Kurz und als Handlung, z. B. „Wohnsitz anmelden“.',
      'steps.description': 'Was genau ist zu tun.',
      'steps.responsibleAuthority': 'Zuständige Stelle, z. B. AMS, ÖGK, MA 35, Finanzamt, Magistrat.',
      'steps.timing': 'Frist oder Zeitrahmen, z. B. „innerhalb von 3 Tagen“.',
      'steps.requiredDocuments': 'Was mitzubringen ist — eine Zeile pro Unterlage.',
      'steps.requiredDocuments.document': 'z. B. „Reisepass“ oder „Mietvertrag“.',
      'steps.linkedGuideArticle': 'Der Guide-Artikel, der diesen Schritt genauer erklärt.',
      'steps.links': 'Formulare oder Seiten der Behörde zu diesem Schritt.',
      'steps.links.label': 'Linktext, z. B. „Meldezettel-Formular“.',
      'steps.links.url': 'Vollständige Adresse (https://…).',
      reviewStatus: STATUS_HELP,
    },
  },
  jobs: {
    labels: { singular: { de: 'Stellenangebot', ar: 'فرصة عمل', en: 'Job posting' }, plural: { de: 'Stellenangebote', ar: 'فرص العمل', en: 'Job postings' } },
    group: GROUPS.content,
    columns: ['title', 'reviewStatus', 'organisation', 'expiryDate', 'updatedAt'],
    settings: ['slug', 'publishedAt', 'expiryDate'],
    help: {
      title: 'Bezeichnung der Stelle. Für jede Sprache einzeln eintragen.',
      slug: SLUG_HELP,
      organisation: 'Name des Unternehmens oder der Einrichtung.',
      city: 'Arbeitsort.',
      bundesland: BUNDESLAND_HELP,
      employmentType: 'Vollzeit, Teilzeit usw.',
      description: 'Aufgaben, Anforderungen, Arbeitszeit, Bezahlung.',
      applyUrl: 'Vollständige Adresse (https://…) oder mailto:-Adresse, an die Bewerbungen gehen. Die Website nimmt selbst keine Bewerbungen entgegen.',
      publishedAt: 'Datum, das bei der Stelle steht. Leer = heute.',
      expiryDate: 'Nach diesem Datum verschwindet die Stelle von selbst von der Website.',
      reviewStatus: STATUS_HELP,
    },
  },
  experts: {
    labels: { singular: { de: 'Expert:in', ar: 'خبير', en: 'Expert' }, plural: { de: 'Expert:innen', ar: 'الخبراء', en: 'Experts' } },
    group: GROUPS.content,
    columns: ['name', 'reviewStatus', 'verificationStatus', 'updatedAt'],
    settings: ['slug', 'consentOnFile', 'consentDate', 'verificationStatus', 'verifiedAt'],
    help: {
      name: 'Vor- und Nachname, wie er im Verzeichnis stehen soll. Wird nicht übersetzt.',
      slug: 'Teil der Web-Adresse. Wird beim Antrag aus dem Namen gebildet; muss eindeutig bleiben.',
      categories: 'Fachgebiete. Besucher:innen können danach filtern.',
      bio: 'Kurzvorstellung in zwei bis vier Sätzen. Für jede Sprache einzeln eintragen.',
      bundesland: 'Bundesland, in dem die Person berät. Das Verzeichnis lässt sich danach filtern.',
      city: 'Ort der Praxis oder Kanzlei.',
      languages: 'Sprachen, in denen beraten wird — eine Zeile pro Sprache.',
      'languages.language': 'z. B. „Deutsch“, „Arabisch“.',
      contactEmail: 'Nur für die interne Kontaktaufnahme — öffentlich erst sichtbar, wenn das Kästchen daneben angekreuzt ist.',
      showEmail: 'Nur ankreuzen, wenn die Person der Veröffentlichung zugestimmt hat.',
      contactPhone: 'Nur für die interne Kontaktaufnahme — öffentlich erst sichtbar, wenn das Kästchen daneben angekreuzt ist.',
      showPhone: 'Nur ankreuzen, wenn die Person der Veröffentlichung zugestimmt hat.',
      website: 'Vollständige Adresse (https://…).',
      photo: 'Wird vom Vorstand nach der Prüfung ergänzt — nicht Teil des öffentlichen Antragsformulars.',
      consentOnFile: 'Wird vom Antragsformular gesetzt, wenn die Person der Datenverarbeitung zugestimmt hat. Ohne Einwilligung nicht veröffentlichen.',
      consentDate: 'Datum der Einwilligung.',
      verificationStatus: 'Erst auf „Verifiziert“ setzen, wenn geprüft ist, dass die Person bei der zuständigen Kammer oder Behörde eingetragen ist. Nur Vorstand und Administration.',
      verifiedAt: 'Datum der Prüfung. Nur Vorstand und Administration.',
      reviewStatus: STATUS_HELP,
    },
  },
  services: {
    labels: { singular: { de: 'Leistung', ar: 'خدمة', en: 'Service' }, plural: { de: 'Leistungen', ar: 'الخدمات', en: 'Services' } },
    group: GROUPS.content,
    columns: ['title', 'reviewStatus', 'pillar', 'updatedAt'],
    settings: ['slug', 'icon', 'relatedServices'],
    help: {
      title: 'Name der Leistung. Für jede Sprache einzeln eintragen.',
      slug: SLUG_HELP,
      pillar: 'Der Schwerpunkt-Bereich, unter dem die Leistung erscheint.',
      summary: 'Ein bis zwei Sätze für die Karte in der Übersicht.',
      body: 'Ausführliche Beschreibung: was wird angeboten, wie läuft es ab.',
      icon: ICON_HELP,
      image: 'Optionales Bild zur Leistung.',
      targetAudience: 'Für wen ist die Leistung gedacht.',
      relatedServices: 'Andere Leistungen, die dazu passen.',
      reviewStatus: STATUS_HELP,
    },
  },
  pages: {
    labels: { singular: { de: 'Seite', ar: 'صفحة', en: 'Page' }, plural: { de: 'Seiten', ar: 'الصفحات', en: 'Pages' } },
    group: GROUPS.content,
    columns: ['title', 'reviewStatus', 'slug', 'updatedAt'],
    settings: ['slug'],
    help: {
      title: 'Titel der Seite. Für jede Sprache einzeln eintragen.',
      slug: 'Legt fest, welche Seite der Website gefüllt wird. Derzeit gibt es eine: „about“ für „Über uns“. Der Slug muss genau so lauten.',
      layout: 'Der Inhalt der Seite, aus Blöcken zusammengesetzt. Ohne mindestens einen Block zeigt die Website einen Platzhalter. Für jede Sprache einzeln anlegen.',
      reviewStatus: STATUS_HELP,
    },
  },
  media: {
    labels: { singular: { de: 'Bild / Datei', ar: 'ملف', en: 'Media file' }, plural: { de: 'Mediathek', ar: 'مكتبة الوسائط', en: 'Media' } },
    group: GROUPS.content,
    columns: ['filename', 'alt', 'updatedAt'],
    help: {
      alt: 'Pflicht. Beschreibt in ein bis zwei Sätzen, was auf dem Bild zu sehen ist — für Screenreader und Suchmaschinen. Für jede Sprache einzeln.',
      caption: 'Optionaler Text unter dem Bild.',
      credit: 'Fotograf:in oder Quelle.',
      consentOnFile: 'Bei Fotos mit erkennbaren Personen: nur ankreuzen, wenn eine schriftliche Einwilligung vorliegt. Ohne Einwilligung nicht hochladen.',
    },
  },
  'contact-submissions': {
    labels: { singular: { de: 'Kontaktanfrage', ar: 'طلب تواصل', en: 'Contact request' }, plural: { de: 'Kontaktanfragen', ar: 'طلبات التواصل', en: 'Contact requests' } },
    group: GROUPS.inbox,
    columns: ['subject', 'status', 'name', 'submittedAt'],
    help: {
      name: 'Aus dem Kontaktformular. Nicht ändern.',
      email: 'Antwortadresse der Person.',
      subject: 'Betreff aus dem Formular.',
      category: 'Anliegen, das im Formular gewählt wurde (z. B. Mitgliedschaft, Ehrenamt, Idee).',
      message: 'Die Nachricht im Wortlaut.',
      locale: 'Sprache, in der das Formular ausgefüllt wurde — in dieser Sprache antworten.',
      consentGiven: 'Die Person hat der Verarbeitung ihrer Angaben zugestimmt.',
      status: 'Nach der Bearbeitung auf „Gelesen“ oder „Archiviert“ setzen, damit der Überblick bleibt.',
      submittedAt: 'Zeitpunkt des Eingangs.',
    },
  },
  categories: {
    labels: { singular: { de: 'Kategorie', ar: 'تصنيف', en: 'Category' }, plural: { de: 'Kategorien', ar: 'التصنيفات', en: 'Categories' } },
    group: GROUPS.structure,
    columns: ['name', 'type', 'updatedAt'],
    boardOnly: true,
    help: {
      name: 'Name der Kategorie, wie er im Filter steht. Für jede Sprache einzeln eintragen.',
      slug: 'Teil der Web-Adresse des Filters. Kleinbuchstaben und Bindestriche.',
      type: 'Wofür die Kategorie gilt: News, Veranstaltungen, Leistungen oder Expert:innen. Sie erscheint nur dort zur Auswahl.',
    },
  },
  'guide-topics': {
    labels: { singular: { de: 'Guide-Thema', ar: 'موضوع الدليل', en: 'Guide topic' }, plural: { de: 'Guide-Themen', ar: 'مواضيع الدليل', en: 'Guide topics' } },
    group: GROUPS.structure,
    columns: ['title', 'order', 'updatedAt'],
    boardOnly: true,
    help: {
      title: 'Name des Themas, z. B. „Wohnen“. Für jede Sprache einzeln eintragen.',
      slug: SLUG_HELP,
      description: 'Ein Satz, worum es bei diesem Thema geht.',
      icon: ICON_HELP,
      order: ORDER_HELP,
    },
  },
  'service-pillars': {
    labels: { singular: { de: 'Schwerpunkt', ar: 'محور', en: 'Service pillar' }, plural: { de: 'Schwerpunkte', ar: 'المحاور', en: 'Service pillars' } },
    group: GROUPS.structure,
    columns: ['title', 'order', 'updatedAt'],
    boardOnly: true,
    help: {
      title: 'Name des Schwerpunkts, z. B. „Bildung & Qualifizierung“. Für jede Sprache einzeln eintragen.',
      slug: SLUG_HELP,
      description: 'Ein bis zwei Sätze zum Schwerpunkt.',
      icon: ICON_HELP,
      colourToken: 'Technisches Feld: Name einer Farbe aus dem Design der Website. Nur nach Rücksprache mit der Entwicklung ändern.',
      order: ORDER_HELP,
    },
  },
  'board-members': {
    labels: { singular: { de: 'Vorstandsmitglied', ar: 'عضو مجلس الإدارة', en: 'Board member' }, plural: { de: 'Vorstand', ar: 'مجلس الإدارة', en: 'Board members' } },
    group: GROUPS.association,
    columns: ['name', 'role', 'order', 'updatedAt'],
    help: {
      name: 'Vor- und Nachname. Wird nicht übersetzt.',
      role: 'Funktion im Verein, z. B. „Obfrau“. Für jede Sprache einzeln eintragen.',
      photo: 'Porträtfoto, nur mit Einwilligung der Person.',
      bio: 'Zwei bis drei Sätze zur Person.',
      email: 'Optional.',
      showEmail: 'Nur ankreuzen, wenn die Adresse öffentlich stehen darf.',
      linkedIn: 'Vollständige Adresse (https://…) des LinkedIn-Profils.',
      showLinkedIn: 'Nur ankreuzen, wenn der Link öffentlich stehen darf.',
      order: ORDER_HELP,
    },
  },
  partners: {
    labels: { singular: { de: 'Partner / Förderer', ar: 'شريك', en: 'Partner' }, plural: { de: 'Partner & Förderer', ar: 'الشركاء والداعمون', en: 'Partners' } },
    group: GROUPS.association,
    columns: ['name', 'type', 'order', 'updatedAt'],
    help: {
      name: 'Name der Organisation.',
      logo: 'Logo als Bild aus der Mediathek, möglichst mit transparentem Hintergrund.',
      url: 'Vollständige Adresse (https://…) der Website. Das Logo wird damit verlinkt.',
      type: 'Fördergeber, Partner oder Sponsor — bestimmt die Gruppe auf der Partnerseite.',
      order: ORDER_HELP,
    },
  },
  users: {
    labels: { singular: { de: 'Benutzer:in', ar: 'مستخدم', en: 'User' }, plural: { de: 'Benutzer:innen', ar: 'المستخدمون', en: 'Users' } },
    group: GROUPS.settings,
    columns: ['name', 'email', 'role', 'updatedAt'],
    help: {
      name: 'Vor- und Nachname. Erscheint in der Benachrichtigung an den Vorstand als „Eingereicht von“.',
      role: 'Redaktion: schreibt Entwürfe und reicht sie ein. Vorstand: veröffentlicht und archiviert. Administration: zusätzlich Benutzer und Löschen. Betrachter:in: nur lesen.',
    },
  },
} satisfies Record<string, Layout>

// ─── Site settings (global) ──────────────────────────────────────────────────

const SITE_SETTINGS_TABS: Array<{ label: Trans; fields: string[] }> = [
  { label: TAB.general, fields: ['logo', 'logoAlt', 'orgName', 'tagline', 'contactGroup', 'socialLinks'] },
  { label: TAB.home, fields: ['homeGroup'] },
  { label: TAB.jobs, fields: ['jobResourceLinks'] },
  { label: TAB.seo, fields: ['seoGroup'] },
  { label: TAB.settings, fields: ['boardNotificationEmails', 'submissionRetentionMonths', 'expertApplicationRetentionMonths'] },
]

const SITE_SETTINGS_HELP = {
  logo: 'Logo für Kopfzeile und Admin-Bereich. Solange keines hochgeladen ist, steht dort der Schriftzug „SVÖ“.',
  logoAlt: 'Helle Fassung des Logos für dunkle Flächen (z. B. die Fußzeile).',
  orgName: 'Name des Vereins, wie er in der Fußzeile und in Suchmaschinen steht.',
  tagline: 'Kurzer Leitsatz unter dem Namen.',
  contactGroup: 'Erscheint in der Fußzeile und auf der Kontaktseite.',
  'contactGroup.address': 'Postanschrift, mehrzeilig.',
  'contactGroup.phone': 'Mit Ländervorwahl, z. B. +43 1 …',
  'contactGroup.email': 'Allgemeine Kontaktadresse des Vereins.',
  'contactGroup.openingHours': 'Zum Beispiel „Mo–Fr 9–17 Uhr“. Für jede Sprache einzeln eintragen.',
  socialLinks: 'Verlinkte Profile in der Fußzeile — eine Zeile pro Plattform.',
  'socialLinks.platform': 'Bestimmt das Symbol.',
  'socialLinks.url': 'Vollständige Adresse (https://…) des Profils.',
  seoGroup: 'Gilt für alle Seiten, die keine eigenen SEO-Angaben haben.',
  'seoGroup.defaultTitle': 'Höchstens 60 Zeichen.',
  'seoGroup.defaultDescription': 'Höchstens 160 Zeichen. Erscheint unter dem Titel in Suchmaschinen.',
  'seoGroup.defaultOgImage': 'Bild, das beim Teilen eines Links angezeigt wird. 1200 × 630 Pixel.',
  jobResourceLinks: 'Links zu AMS, karriere.at usw. Stehen auf der Stellenseite neben den eigenen Angeboten.',
  'jobResourceLinks.label': 'Linktext.',
  'jobResourceLinks.url': 'Vollständige Adresse (https://…).',
  'jobResourceLinks.description': 'Ein Satz, was man dort findet.',
  homeGroup: 'Texte und Reihenfolge der Startseite. Alle Felder sind freiwillig: Ein leeres Feld zeigt den eingebauten Text der jeweiligen Sprache. Jede Sprache wird einzeln ausgefüllt — ein deutscher Text ersetzt den arabischen oder englischen nicht.',
  'homeGroup.sectionOrder.section': 'Welcher Abschnitt an dieser Stelle steht.',
  'homeGroup.sectionOrder.enabled': 'Häkchen entfernen, um den Abschnitt auszublenden.',
  'homeGroup.heroHeadline': 'Die große Überschrift ganz oben.',
  'homeGroup.heroSubline': 'Der Absatz unter der Überschrift.',
  'homeGroup.heroCtaLabel': 'Beschriftung des Buttons im oberen Bereich.',
  'homeGroup.heroCtaHref': 'Interner Pfad, z. B. /contact. Gilt für alle Sprachen.',
  'homeGroup.statLabels': 'Kacheln mit Zahlen unter dem oberen Bereich. Eine Kachel erscheint erst, wenn es mindestens drei veröffentlichte Einträge gibt.',
  'homeGroup.statLabels.label': 'Text unter der Zahl, z. B. „Expert:innen“.',
  'homeGroup.statLabels.source': 'Was gezählt wird.',
  'homeGroup.helpCards': 'Die Karten unter „Wie können wir Ihnen helfen?“. Leer = eingebaute Karten. Eine Karte ohne Titel in einer Sprache wird in dieser Sprache nicht gezeigt.',
  'homeGroup.helpCards.title': 'Überschrift der Karte.',
  'homeGroup.helpCards.description': 'Ein Satz zur Karte.',
  'homeGroup.helpCards.href': 'Interner Pfad, z. B. /guide oder /contact.',
  'homeGroup.ctaBandHeading': 'Überschrift des grünen Bandes. Wird hier etwas eingetragen, ersetzt das Band die beiden eingebauten Karten „Ehrenamt“ und „Idee“.',
  'homeGroup.ctaBandBody': 'Text unter der Überschrift.',
  'homeGroup.ctaBandCtaLabel': 'Beschriftung des Buttons.',
  'homeGroup.ctaBandCtaHref': 'Interner Pfad, z. B. /contact. Gilt für alle Sprachen.',
  submissionRetentionMonths: 'DSGVO: Kontaktanfragen werden nach so vielen Monaten gelöscht.',
  expertApplicationRetentionMonths: 'DSGVO: Anträge von Expert:innen, die nie veröffentlicht wurden, werden nach so vielen Monaten gelöscht.',
  boardNotificationEmails: 'An diese Adressen geht die E-Mail, wenn die Redaktion etwas zur Überprüfung einreicht.',
  'boardNotificationEmails.email': 'Eine Adresse pro Zeile.',
} satisfies Record<string, string>

const SEO_HELP = {
  seo: 'Angaben für Suchmaschinen und geteilte Links. Leer lassen — dann werden Titel und Kurzbeschreibung des Eintrags verwendet.',
  'seo.title': 'Höchstens 60 Zeichen. Leer = Titel des Eintrags.',
  'seo.description': 'Höchstens 160 Zeichen. Leer = Kurzbeschreibung des Eintrags.',
  'seo.ogImage': 'Bild beim Teilen des Links. Leer = Titelbild oder Standardbild.',
  'seo.noIndex': 'Ankreuzen, wenn die Seite nicht in Suchmaschinen erscheinen soll.',
} satisfies Record<string, string>

/** The shape a translation of the help texts has to have: every German text, no more and no fewer. */
export type AdminHelp = {
  collections: { [Slug in keyof typeof LAYOUT]: Record<keyof (typeof LAYOUT)[Slug]['help'], string> }
  siteSettings: Record<keyof typeof SITE_SETTINGS_HELP, string>
  seo: Record<keyof typeof SEO_HELP, string>
}

// ─── Applying it ─────────────────────────────────────────────────────────────

type AnyField = Field & { name?: string; fields?: Field[]; admin?: Record<string, unknown> }

/** Every field name a field covers — its own, or those inside a row / collapsible. */
function namesIn(field: Field): string[] {
  const f = field as AnyField
  if (f.name) return [f.name]
  return (f.fields ?? []).flatMap(namesIn)
}

type Help = Record<string, Trans>

/** One help text per field path in all three languages, from the German texts and their translations. */
function inAllLanguages(de: Record<string, string>, ...translated: Array<{ ar: Record<string, string>; en: Record<string, string> }>): Help {
  const ofAll = (lang: 'ar' | 'en', path: string) => translated.map((t) => t[lang][path]).find(Boolean) ?? ''
  return Object.fromEntries(Object.entries(de).map(([path, text]) => [path, { de: text, ar: ofAll('ar', path), en: ofAll('en', path) }]))
}

/** Sets the help text on every field that has one in `help`, in all three admin languages. */
function withHelp(fields: Field[], help: Help, prefix = ''): Field[] {
  return fields.map((field) => {
    const f = field as AnyField
    if (f.type === 'blocks') return field
    const path = f.name ? `${prefix}${f.name}` : prefix.replace(/\.$/, '')
    const children = f.fields ? { fields: withHelp(f.fields, help, f.name ? `${path}.` : prefix) } : {}
    const text = f.name ? help[path] : undefined
    if (!text) return { ...field, ...children } as Field
    return { ...field, ...children, admin: { ...f.admin, description: text } } as Field
  })
}

const inSidebar = (field: Field): Field => ({ ...field, admin: { ...(field as AnyField).admin, position: 'sidebar' } }) as Field

export function withAdminLayout(collection: CollectionConfig): CollectionConfig {
  const slug = collection.slug as keyof typeof LAYOUT
  const layout: Layout | undefined = LAYOUT[slug]
  if (!layout) return collection

  let fields = withHelp(
    collection.fields,
    inAllLanguages(
      { ...SEO_HELP, ...layout.help },
      { ar: ar.collections[slug], en: en.collections[slug] },
      { ar: ar.seo, en: en.seo },
    ),
  )

  if (layout.settings) {
    const status = fields.filter((f) => namesIn(f).includes('reviewStatus'))
    const seo = fields.filter((f) => namesIn(f).includes('seo'))
    const settings = fields.filter((f) => namesIn(f).some((name) => layout.settings!.includes(name)))
    const content = fields.filter((f) => !status.includes(f) && !seo.includes(f) && !settings.includes(f))
    const tabs: Tab[] = [{ label: TAB.content, fields: content }]
    if (seo.length > 0) tabs.push({ label: TAB.seo, fields: seo })
    tabs.push({ label: TAB.settings, fields: settings })
    // The Status field stays outside the tabs, in the sidebar: visible whichever tab is open.
    fields = [{ type: 'tabs', tabs }, ...status.map(inSidebar)]
  }

  return {
    ...collection,
    labels: layout.labels,
    fields,
    admin: {
      ...collection.admin,
      group: layout.group,
      defaultColumns: layout.columns,
      ...(layout.boardOnly ? { hidden: ({ user }) => !['admin', 'board'].includes((user as { role?: string } | null)?.role ?? '') } : {}),
    },
  }
}

export function withSiteSettingsLayout(global: GlobalConfig): GlobalConfig {
  const fields = withHelp(global.fields, inAllLanguages(SITE_SETTINGS_HELP, { ar: ar.siteSettings, en: en.siteSettings }))
  const placed = new Set<Field>()
  const tabs: Tab[] = SITE_SETTINGS_TABS.map((tab) => {
    const own = fields.filter((f) => namesIn(f).some((name) => tab.fields.includes(name)))
    own.forEach((f) => placed.add(f))
    return { label: tab.label, fields: own }
  })
  // A field added later and not assigned to a tab must not vanish from the form.
  const rest = fields.filter((f) => !placed.has(f))
  if (rest.length > 0) tabs[0] = { ...tabs[0], fields: [...tabs[0].fields, ...rest] }
  return {
    ...global,
    label: { de: 'Website-Einstellungen', ar: 'إعدادات الموقع', en: 'Site settings' },
    fields: [{ type: 'tabs', tabs }],
    admin: { ...global.admin, group: GROUPS.settings },
  }
}

/** Sidebar order: the collections people open daily first, the rarely touched ones last. */
export const ADMIN_COLLECTION_ORDER = [
  'news',
  'events',
  'guide-articles',
  'roadmaps',
  'jobs',
  'experts',
  'services',
  'pages',
  'media',
  'contact-submissions',
  'categories',
  'guide-topics',
  'service-pillars',
  'board-members',
  'partners',
  'users',
]

export function inAdminOrder<T extends { slug: string }>(collections: T[]): T[] {
  const rank = (slug: string) => {
    const i = ADMIN_COLLECTION_ORDER.indexOf(slug)
    return i === -1 ? ADMIN_COLLECTION_ORDER.length : i
  }
  return [...collections].sort((a, b) => rank(a.slug) - rank(b.slug))
}
