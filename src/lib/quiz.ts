/**
 * The "Was ist meine Situation?" quiz (Figma 3.png — the green band under the roadmap cards).
 *
 * Single source of truth for the tag vocabulary, shared by `Roadmaps.quizMatches`'s field config
 * and the quiz UI, so the options a board member can tick and the answers a visitor can give can
 * never drift apart — same pattern as `src/lib/homeSections.ts`.
 *
 * How matching works: questions 2 (situation) and 4 (goal) both answer in this one vocabulary, so
 * a roadmap tagged `job_seeking` is surfaced both by "I'm looking for work" and by "my goal is to
 * find work". Scoring is a plain tag intersection — no hidden weighting, nothing invented: a
 * roadmap the board has not tagged simply never matches, and the results page says so rather than
 * padding the list.
 */

export const QUIZ_TAGS = [
  'newly_arrived',
  'job_seeking',
  'learning_german',
  'housing',
  'qualification_recognition',
  'family',
  'health',
  'residence_permit',
  'studying',
] as const

export type QuizTag = (typeof QUIZ_TAGS)[number]

type Trans = { de: string; ar: string; en: string }

export const QUIZ_TAG_LABELS: Record<QuizTag, Trans> = {
  newly_arrived: { de: 'Neu in Österreich', ar: 'جديد في النمسا', en: 'New in Austria' },
  job_seeking: { de: 'Arbeitssuche', ar: 'البحث عن عمل', en: 'Looking for work' },
  learning_german: { de: 'Deutsch lernen', ar: 'تعلم الألمانية', en: 'Learning German' },
  housing: { de: 'Wohnen', ar: 'السكن', en: 'Housing' },
  qualification_recognition: { de: 'Anerkennung von Abschlüssen', ar: 'الاعتراف بالشهادات', en: 'Recognition of qualifications' },
  family: { de: 'Familie', ar: 'الأسرة', en: 'Family' },
  health: { de: 'Gesundheit', ar: 'الصحة', en: 'Health' },
  residence_permit: { de: 'Aufenthalt', ar: 'الإقامة', en: 'Residence' },
  studying: { de: 'Studium', ar: 'الدراسة', en: 'Studying' },
}

// ─── The four questions ───────────────────────────────────────────────────────

export type QuizQuestionId = 'bundesland' | 'situation' | 'german' | 'goal'

export type QuizOption = {
  value: string
  label: Trans
  /** Tags this answer contributes to the roadmap score. Empty for questions that don't rank. */
  tags: QuizTag[]
}

export type QuizQuestion = {
  id: QuizQuestionId
  title: Trans
  hint?: Trans
  options: QuizOption[]
}

/**
 * Bundesland deliberately contributes no tags: roadmaps describe federal procedures, so filtering
 * them by state would invent a distinction that isn't in the content. It is asked because the
 * results page uses it to point at experts in the right place, and because the Figma asks it.
 */
const BUNDESLAND_OPTIONS: QuizOption[] = [
  { value: 'W', label: { de: 'Wien', ar: 'فيينا', en: 'Vienna' }, tags: [] },
  { value: 'NOE', label: { de: 'Niederösterreich', ar: 'النمسا السفلى', en: 'Lower Austria' }, tags: [] },
  { value: 'OOE', label: { de: 'Oberösterreich', ar: 'النمسا العليا', en: 'Upper Austria' }, tags: [] },
  { value: 'SBG', label: { de: 'Salzburg', ar: 'زالتسبورغ', en: 'Salzburg' }, tags: [] },
  { value: 'T', label: { de: 'Tirol', ar: 'تيرول', en: 'Tyrol' }, tags: [] },
  { value: 'VBG', label: { de: 'Vorarlberg', ar: 'فورارلبرغ', en: 'Vorarlberg' }, tags: [] },
  { value: 'STMK', label: { de: 'Steiermark', ar: 'شتايرمارك', en: 'Styria' }, tags: [] },
  { value: 'KTN', label: { de: 'Kärnten', ar: 'كارينثيا', en: 'Carinthia' }, tags: [] },
  { value: 'BGLD', label: { de: 'Burgenland', ar: 'بورغنلاند', en: 'Burgenland' }, tags: [] },
]

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'bundesland',
    title: { de: 'Wo leben Sie?', ar: 'أين تعيش؟', en: 'Where do you live?' },
    hint: {
      de: 'Damit wir Ihnen Expert:innen in Ihrer Nähe zeigen können.',
      ar: 'لنتمكن من عرض خبراء بالقرب منك.',
      en: 'So we can show you experts near you.',
    },
    options: BUNDESLAND_OPTIONS,
  },
  {
    id: 'situation',
    title: { de: 'Was beschreibt Ihre Situation am besten?', ar: 'ما الذي يصف وضعك الحالي؟', en: 'What best describes your situation?' },
    options: [
      { value: 'new', label: { de: 'Ich bin neu in Österreich', ar: 'أنا جديد في النمسا', en: 'I am new in Austria' }, tags: ['newly_arrived', 'residence_permit'] },
      { value: 'working', label: { de: 'Ich arbeite bereits', ar: 'أعمل بالفعل', en: 'I am already working' }, tags: ['qualification_recognition'] },
      { value: 'seeking', label: { de: 'Ich suche Arbeit', ar: 'أبحث عن عمل', en: 'I am looking for work' }, tags: ['job_seeking'] },
      { value: 'studying', label: { de: 'Ich studiere oder gehe zur Schule', ar: 'أدرس أو أذهب إلى المدرسة', en: 'I am studying or at school' }, tags: ['studying'] },
      { value: 'family', label: { de: 'Ich kümmere mich um meine Familie', ar: 'أعتني بعائلتي', en: 'I am caring for my family' }, tags: ['family'] },
    ],
  },
  {
    id: 'german',
    title: { de: 'Wie gut sprechen Sie Deutsch?', ar: 'ما مستواك في اللغة الألمانية؟', en: 'How is your German?' },
    options: [
      { value: 'none', label: { de: 'Noch gar nicht', ar: 'لا أتحدثها بعد', en: 'Not at all yet' }, tags: ['learning_german'] },
      { value: 'basic', label: { de: 'Ein paar Sätze (A1–A2)', ar: 'بعض الجمل (A1–A2)', en: 'A few sentences (A1–A2)' }, tags: ['learning_german'] },
      { value: 'good', label: { de: 'Gut im Alltag (B1–B2)', ar: 'جيد في الحياة اليومية (B1–B2)', en: 'Fine day to day (B1–B2)' }, tags: [] },
      { value: 'fluent', label: { de: 'Sehr gut (C1+)', ar: 'ممتاز (C1+)', en: 'Very good (C1+)' }, tags: [] },
    ],
  },
  {
    id: 'goal',
    title: { de: 'Was möchten Sie als Nächstes erreichen?', ar: 'ما الذي تريد تحقيقه بعد ذلك؟', en: 'What do you want to achieve next?' },
    options: [
      { value: 'work', label: { de: 'Arbeit finden', ar: 'إيجاد عمل', en: 'Find work' }, tags: ['job_seeking'] },
      { value: 'german', label: { de: 'Deutsch lernen', ar: 'تعلم الألمانية', en: 'Learn German' }, tags: ['learning_german'] },
      { value: 'home', label: { de: 'Eine Wohnung finden', ar: 'إيجاد سكن', en: 'Find a flat' }, tags: ['housing'] },
      { value: 'recognition', label: { de: 'Meinen Abschluss anerkennen lassen', ar: 'الاعتراف بشهادتي', en: 'Get my qualification recognised' }, tags: ['qualification_recognition'] },
      { value: 'papers', label: { de: 'Behördliches erledigen', ar: 'إنجاز المعاملات الرسمية', en: 'Sort out official paperwork' }, tags: ['residence_permit', 'newly_arrived'] },
      { value: 'health', label: { de: 'Gesundheitsversorgung klären', ar: 'ترتيب الرعاية الصحية', en: 'Sort out healthcare' }, tags: ['health'] },
    ],
  },
]

export type QuizAnswers = Partial<Record<QuizQuestionId, string>>

/** Every tag implied by a set of answers. */
export function tagsForAnswers(answers: QuizAnswers): QuizTag[] {
  const tags = new Set<QuizTag>()
  for (const question of QUIZ_QUESTIONS) {
    const chosen = answers[question.id]
    if (!chosen) continue
    const option = question.options.find((o) => o.value === chosen)
    option?.tags.forEach((t) => tags.add(t))
  }
  return [...tags]
}

/**
 * Ranks roadmaps by how many of the visitor's tags they carry. Ties keep the incoming order
 * (which is `sort: 'title'` from the query), and anything with zero matching tags is dropped
 * rather than shown as a weak suggestion — a roadmap the board hasn't tagged is not a match, and
 * saying "no match" is more useful than a confident-looking wrong answer.
 */
export function rankByTags<T extends { quizMatches?: string[] | null }>(
  items: T[],
  tags: QuizTag[],
): Array<{ item: T; score: number }> {
  if (tags.length === 0) return []
  return items
    .map((item) => {
      const own = new Set(item.quizMatches ?? [])
      return { item, score: tags.filter((t) => own.has(t)).length }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
}
