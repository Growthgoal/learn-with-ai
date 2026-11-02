/**
 * Every skill Learn with AI teaches.
 *
 * A skill is data, not code: the same engine interviews the learner, writes
 * the workbook, helps when they are stuck and checks the work for all of
 * them. What changes per skill is who it is for and how the work is proved.
 */

export type Age = 'kids-3-7' | 'kids-8-12' | 'teens' | 'college' | 'working' | 'seniors'

/** How finished work comes back to be checked. */
export type Proof =
  | 'pages' // photos of the filled workbook pages
  | 'file' // a spreadsheet, slides, code or a link
  | 'result' // a photo of the thing they made
  | 'typed' // answers typed into the app
  | 'voice' // a recording, transcribed by Muse Voice Transcribe

export interface Skill {
  id: string
  group: string
  name: string
  ages: Age[]
  proof: Proof
  /** What the learner hands in, in a few words. */
  handIn: string
  /** GrowthGoal already sells a workbook or course for it. */
  weSell: boolean
  band: Band
  /**
   * Writing itself is the skill (handwriting, scripts, written recitation),
   * so tracing and copying belong in its workbook. Everywhere else they are
   * padding: a senior learning UPI safety does not need handwriting practice.
   */
  writing: boolean
}

/**
 * Every skill comes in three workbooks. Each level is a bigger book than the
 * one before, and starts where it ended.
 */
export const LEVELS = [
  { n: 1, name: 'Basic', size: 'starter', about: 'First steps: the core idea, practised until it is easy.' },
  { n: 2, name: 'Advanced', size: 'standard', about: 'Builds on Basic: more of the skill, in real situations.' },
  { n: 3, name: 'Pro', size: 'pro', about: 'The whole skill, done well and on your own.' },
] as const
export const sizeForLevel = (n: number) => LEVELS.find((l) => l.n === n)?.size ?? 'standard'

/** What a skill is worth to the learner decides its price band (see prices.ts). */
export type Band = 'kids' | 'life' | 'career'

const A: Record<string, Age> = { K1: 'kids-3-7', K2: 'kids-8-12', T: 'teens', C: 'college', W: 'working', S: 'seniors' }
const P: Record<string, Proof> = { P: 'pages', F: 'file', R: 'result', Y: 'typed', V: 'voice' }

// [group, name, ages, proof, we sell it, what they hand in]
const ROWS: [string, string, string, string, 0 | 1, string][] = [
  ['Early learning', 'Pencil control and tracing', 'K1', 'P', 1, 'Traced lines, curves and mazes'],
  ['Early learning', 'Phonics and letter sounds', 'K1', 'P', 1, 'Sound-to-letter matching pages'],
  ['Early learning', 'Sight words', 'K1', 'P', 1, 'Read-and-write word pages'],
  ['Early learning', 'Numbers and counting', 'K1', 'P', 1, 'Counting and number-writing pages'],
  ['Early learning', 'Shapes and patterns', 'K1', 'P', 1, 'Pattern and shape pages'],
  ['Early learning', 'Colouring and colour sense', 'K1', 'P', 1, 'Coloured pages, checked for staying in lines'],
  ['Early learning', 'Scissor skills', 'K1', 'R', 1, 'Photo of cut-out shapes'],
  ['Early learning', 'Memory and matching', 'K1', 'P', 1, 'Matching and recall pages'],
  ['Early learning', 'Good habits and manners', 'K1 K2', 'P', 1, 'Habit charts and picture tasks'],
  ['Early learning', 'My world (EVS)', 'K1 K2', 'P', 1, 'Animals, seasons, helpers pages'],
  ['Early learning', 'Reading aloud', 'K1 K2', 'V', 0, 'Recordings of short passages read aloud'],

  ['Handwriting and writing', 'English handwriting (print)', 'K1 K2 T W S', 'P', 1, 'Written pages; every letter scored'],
  ['Handwriting and writing', 'Cursive writing', 'K2 T W', 'P', 1, 'Joined-letter pages'],
  ['Handwriting and writing', 'Hindi sulekh: varnamala, matra, barakhadi', 'K1 K2 T S', 'P', 1, 'Devanagari practice pages'],
  ['Handwriting and writing', 'Calligraphy and brush lettering', 'T C W S', 'P', 1, 'Stroke and alphabet sheets'],
  ['Handwriting and writing', 'Speed writing for board exams', 'T', 'P', 1, 'Timed passages'],
  ['Handwriting and writing', 'Essay writing', 'K2 T C', 'P', 1, 'Handwritten or typed essays'],
  ['Handwriting and writing', 'Letter and application writing', 'K2 T', 'P', 1, 'Formal and informal letters'],
  ['Handwriting and writing', 'Creative writing and stories', 'K2 T C W', 'Y', 0, 'Own stories, chapter by chapter'],
  ['Handwriting and writing', 'Poetry writing', 'T C W S', 'Y', 0, 'Poems with form exercises'],
  ['Handwriting and writing', 'Journaling', 'T C W S', 'P', 0, 'Guided journal pages'],

  ['Maths and thinking', 'School maths, class 1–5', 'K1 K2', 'P', 1, 'Worked steps on paper'],
  ['Maths and thinking', 'School maths, class 6–10', 'K2 T', 'P', 0, 'Worked steps on paper'],
  ['Maths and thinking', 'Times tables and mental maths', 'K2', 'P', 1, 'Drill pages'],
  ['Maths and thinking', 'Vedic maths', 'K2 T C', 'P', 0, 'Shortcut practice pages'],
  ['Maths and thinking', 'Word problems', 'K2 T', 'P', 1, 'Two-step problems with working'],
  ['Maths and thinking', 'Logic and number puzzles', 'K2 T C W S', 'P', 1, 'Sudoku, logic grids, crosswords'],
  ['Maths and thinking', 'Chess tactics', 'K2 T C W S', 'Y', 0, 'Moves for diagram puzzles'],
  ['Maths and thinking', 'Critical thinking and problem solving', 'T C W', 'Y', 0, 'Case questions with reasoning'],
  ['Maths and thinking', 'Aptitude and reasoning for exams', 'T C', 'Y', 0, 'Timed question sets'],
  ['Maths and thinking', 'Data interpretation', 'T C W', 'Y', 0, 'Chart and table questions'],
  ['Maths and thinking', 'Brain fitness for seniors', 'S', 'P', 0, 'Memory and puzzle pages'],

  ['Languages and communication', 'English grammar', 'K2 T C W', 'Y', 0, 'Exercises and own sentences'],
  ['Languages and communication', 'Vocabulary builder', 'K2 T C W', 'Y', 0, 'Word use in own sentences'],
  ['Languages and communication', 'Reading comprehension', 'K1 K2 T', 'P', 1, 'Answers to passage questions'],
  ['Languages and communication', 'Spoken English', 'T C W', 'V', 1, 'Daily recordings of guided speaking'],
  ['Languages and communication', 'English pronunciation', 'K2 T C W', 'V', 0, 'Recordings of word and sentence drills'],
  ['Languages and communication', 'Business English and email writing', 'C W', 'Y', 0, 'Real-situation emails'],
  ['Languages and communication', 'Public speaking', 'T C W', 'V', 0, 'Recorded speeches with written outlines'],
  ['Languages and communication', 'Interview speaking practice', 'C W', 'V', 1, 'Recorded answers to interview questions'],
  ['Languages and communication', 'Hindi vyakaran', 'K2 T', 'P', 0, 'Grammar exercises'],
  ['Languages and communication', 'Sanskrit basics', 'K2 T C S', 'P', 0, 'Script and simple sentences'],
  ['Languages and communication', 'French, German or Spanish starter', 'T C W', 'Y', 0, 'Written beginner exercises'],
  ['Languages and communication', 'Translation practice, Hindi–English', 'T C W', 'Y', 0, 'Translated passages'],

  ['Art and creativity', 'Drawing basics', 'K1 K2 T C W S', 'P', 0, 'Step-by-step drawings'],
  ['Art and creativity', 'Sketching and shading', 'K2 T C W', 'P', 0, 'Shading studies'],
  ['Art and creativity', 'Cartoons and comics', 'K2 T C', 'P', 0, 'Panels and characters'],
  ['Art and creativity', 'Colour theory and painting', 'K2 T C W S', 'R', 0, 'Photo of paintings'],
  ['Art and creativity', 'Rangoli and mandala', 'K2 T W S', 'P', 1, 'Dot-grid designs, symmetry checked'],
  ['Art and creativity', 'Doodle art', 'K1 K2 T C W S', 'P', 0, 'Doodle pages'],
  ['Art and creativity', 'Craft and origami', 'K1 K2 T', 'R', 1, 'Photo of the made piece'],
  ['Art and creativity', 'Mobile photography', 'T C W S', 'F', 0, 'Photos taken for each brief'],
  ['Art and creativity', 'Graphic design with Canva', 'T C W', 'F', 0, 'Posters and posts, exported'],
  ['Art and creativity', 'Fashion sketching', 'T C W', 'P', 0, 'Figure and garment sketches'],
  ['Art and creativity', 'Music theory and notation', 'K2 T C W S', 'P', 0, 'Written notation exercises'],
  ['Art and creativity', 'Storytelling aloud', 'K1 K2 T', 'V', 0, 'Recorded stories'],

  ['Work and career', 'Excel', 'C W', 'F', 1, 'Filled spreadsheet files'],
  ['Work and career', 'Google Sheets', 'C W', 'F', 0, 'Sheet links'],
  ['Work and career', 'PowerPoint and presentations', 'C W', 'F', 0, 'Slide decks'],
  ['Work and career', 'Resume and LinkedIn', 'C W', 'F', 1, 'Resume file and profile text'],
  ['Work and career', 'Interview preparation', 'C W', 'Y', 1, 'Written STAR answers'],
  ['Work and career', 'Workplace email etiquette', 'C W', 'Y', 0, 'Replies to real scenarios'],
  ['Work and career', 'Project management', 'C W', 'F', 1, 'Plans, schedules, risk logs'],
  ['Work and career', 'Business analysis', 'C W', 'F', 1, 'Requirements and user stories'],
  ['Work and career', 'Product management', 'C W', 'F', 1, 'PRDs and roadmaps'],
  ['Work and career', 'Agile and Scrum', 'C W', 'Y', 1, 'Scenario answers, backlog'],
  ['Work and career', 'Software testing (QA)', 'C W', 'F', 1, 'Test cases and bug reports'],
  ['Work and career', 'Digital marketing', 'C W', 'F', 1, 'Campaign plans and posts'],
  ['Work and career', 'Meta and Instagram ads', 'C W', 'F', 1, 'Ad sets and creatives'],
  ['Work and career', 'Social media content', 'T C W', 'F', 0, 'Posts and a content calendar'],
  ['Work and career', 'SEO basics', 'C W', 'F', 0, 'Keyword plan and page fixes'],
  ['Work and career', 'Copywriting', 'C W', 'Y', 0, 'Ads, product pages, emails'],
  ['Work and career', 'Video editing', 'T C W', 'F', 1, 'Edited clips, by link'],
  ['Work and career', 'Sales and negotiation', 'C W', 'V', 0, 'Recorded role-plays'],
  ['Work and career', 'Customer service', 'C W', 'Y', 0, 'Replies to complaint cases'],
  ['Work and career', 'Start a small business: business plan', 'C W', 'F', 0, 'A one-page plan and numbers'],
  ['Work and career', 'Bookkeeping and Tally basics', 'C W', 'F', 0, 'Ledgers and entries'],
  ['Work and career', 'GST basics for small business', 'W', 'Y', 0, 'Invoice and return exercises'],

  ['Tech and AI', 'Prompt engineering and AI tools', 'T C W S', 'Y', 1, 'Prompts and their results'],
  ['Tech and AI', 'AI for students', 'T C', 'Y', 1, 'Study tasks done with AI'],
  ['Tech and AI', 'Python basics', 'T C W', 'F', 0, 'Code files'],
  ['Tech and AI', 'HTML and CSS', 'T C W', 'F', 0, 'A small website'],
  ['Tech and AI', 'SQL', 'C W', 'F', 1, 'Queries on sample data'],
  ['Tech and AI', 'Data analysis', 'C W', 'F', 0, 'Analysis in a sheet or notebook'],
  ['Tech and AI', 'No-code automation', 'C W', 'F', 0, 'Working automation, by screenshot'],
  ['Tech and AI', 'Cybersecurity basics', 'T C W', 'Y', 0, 'Spot-the-scam cases'],
  ['Tech and AI', 'Computer basics', 'S', 'R', 0, 'Screenshots of each task done'],
  ['Tech and AI', 'Smartphone and UPI safety', 'S W', 'Y', 0, 'Fraud cases: safe or not'],

  ['Life skills', 'Study skills and memory techniques', 'K2 T C', 'Y', 0, 'Notes and recall tests'],
  ['Life skills', 'Time management', 'T C W', 'P', 0, 'Weekly plans, filled in'],
  ['Life skills', 'Goal setting and habits', 'T C W S', 'P', 1, 'Habit trackers'],
  ['Life skills', 'Budgeting and money basics', 'T C W', 'F', 0, 'A real monthly budget'],
  ['Life skills', 'Emotional intelligence', 'K2 T C W', 'Y', 1, 'Reflection exercises'],
  ['Life skills', 'Mindfulness journaling', 'T C W S', 'P', 1, 'Gratitude and feelings pages'],
  ['Life skills', 'Positive parenting', 'W', 'Y', 0, 'Situation plans for home'],
  ['Life skills', 'Cooking basics', 'T C W', 'R', 0, 'Photo of each dish'],
  ['Life skills', 'Kitchen gardening', 'K2 T W S', 'R', 0, 'Plant photos over weeks'],
  ['Life skills', 'Home organisation', 'C W', 'R', 0, 'Before-and-after photos'],
  ['Life skills', 'Sewing basics', 'T W S', 'R', 0, 'Photos of seams and stitches'],

  ['Culture and spirituality', 'Hanuman Chalisa: learn and write', 'K2 T W S', 'P', 1, 'Written verses'],
  ['Culture and spirituality', 'Naam jaap writing', 'T W S', 'P', 1, 'Written naam pages'],
  ['Culture and spirituality', 'Aartis and shlokas', 'K2 T W S', 'V', 1, 'Recorded recitation and written meaning'],
  ['Culture and spirituality', 'Ramayan and Mahabharat stories', 'K1 K2', 'P', 1, 'Read, draw and answer pages'],
  ['Culture and spirituality', 'Bhagavad Gita, one shloka a day', 'T C W S', 'P', 0, 'Shloka, meaning, own reflection'],
  ['Culture and spirituality', 'Festivals and traditions of India', 'K1 K2', 'P', 1, 'Activity pages'],
  ['Culture and spirituality', 'Sanskar: values for kids', 'K1 K2', 'P', 1, 'Daily value tasks'],

  ['School and exams', 'Board exam answer writing', 'T', 'P', 0, 'Answers checked on board pattern'],
  ['School and exams', 'Notes making', 'K2 T C', 'P', 0, 'Chapter notes'],
  ['School and exams', 'Science concepts, class 6–10', 'K2 T', 'P', 0, 'Explain-and-draw pages'],
  ['School and exams', 'Science experiments journal', 'K2 T', 'R', 0, 'Photos and observations'],
]

const slug = (s: string) =>
  s.toLowerCase().replace(/[–—]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const WRITING = new Set(['hanuman-chalisa-learn-and-write', 'naam-jaap-writing', 'sanskrit-basics', 'school-maths-class-1-5'])
const WRITING_GROUPS = new Set(['Handwriting and writing', 'Early learning'])

/** Everyday safety skills stay affordable even though they sit under Tech. */
const EVERYDAY = new Set(['computer-basics', 'smartphone-and-upi-safety', 'cybersecurity-basics'])
const bandOf = (id: string, group: string, ages: Age[]): Band =>
  EVERYDAY.has(id)
    ? 'life'
    : group === 'Work and career' || group === 'Tech and AI'
    ? 'career'
    : group === 'Early learning' || ages.every((a) => a === 'kids-3-7' || a === 'kids-8-12')
      ? 'kids'
      : 'life'

export const SKILLS: Skill[] = ROWS.map(([group, name, ages, proof, weSell, handIn]) => {
  const a = ages.split(' ').map((x) => A[x])
  const id = slug(name)
  return { id, group, name, ages: a, proof: P[proof], handIn, weSell: weSell === 1, band: bandOf(id, group, a), writing: WRITING.has(id) || WRITING_GROUPS.has(group) }
})

export const skillById = (id: string) => SKILLS.find((s) => s.id === id)
