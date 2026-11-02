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
// Ages are who really looks for the skill, not everyone who could take it:
// the Seniors filter must never show a child's handwriting book.
const ROWS: [string, string, string, string, 0 | 1, string][] = [
  ['Tech and AI', 'AI literacy: how AI works and how to use it', 'T C W', 'Y', 0, 'AI tasks done, with what you asked and got'],
  ['Tech and AI', 'Prompt engineering and AI tools', 'T C W', 'Y', 1, 'Prompts and their results'],
  ['Tech and AI', 'ChatGPT and AI at work', 'C W', 'Y', 0, 'Real work tasks done with AI'],
  ['Tech and AI', 'AI for students', 'T C', 'Y', 1, 'Study tasks done with AI'],
  ['Tech and AI', 'AI image and video creation', 'T C W', 'F', 0, 'Images and clips made, by link'],
  ['Tech and AI', 'Python basics', 'T C W', 'F', 0, 'Code files'],
  ['Tech and AI', 'JavaScript basics', 'T C W', 'F', 0, 'Code files'],
  ['Tech and AI', 'HTML and CSS', 'T C W', 'F', 0, 'A small website'],
  ['Tech and AI', 'Build a website with WordPress', 'C W', 'F', 0, 'A working site, by link'],
  ['Tech and AI', 'SQL', 'C W', 'F', 1, 'Queries on sample data'],
  ['Tech and AI', 'Data analysis', 'C W', 'F', 0, 'Analysis in a sheet or notebook'],
  ['Tech and AI', 'Power BI dashboards', 'C W', 'F', 0, 'Dashboards, by screenshot'],
  ['Tech and AI', 'Machine learning basics', 'C W', 'F', 0, 'Notebooks with small models'],
  ['Tech and AI', 'Cloud computing basics', 'C W', 'Y', 0, 'Scenario answers and diagrams'],
  ['Tech and AI', 'UI and UX design', 'C W', 'F', 0, 'Screens and flows, exported'],
  ['Tech and AI', 'Build apps without code', 'C W', 'F', 0, 'A working app, by link'],
  ['Tech and AI', 'No-code automation', 'C W', 'F', 0, 'Working automation, by screenshot'],
  ['Tech and AI', 'Cybersecurity basics', 'T C W', 'Y', 0, 'Spot-the-scam cases'],
  ['Tech and AI', 'Touch typing', 'K2 T C W', 'Y', 0, 'Typing tests, speed and accuracy'],
  ['Tech and AI', 'MS Word and documents', 'C W S', 'F', 0, 'Formatted documents'],
  ['Tech and AI', 'Coding for kids with Scratch', 'K2', 'F', 0, 'Scratch projects, by link'],
  ['Tech and AI', 'Computer basics', 'W S', 'R', 0, 'Screenshots of each task done'],
  ['Tech and AI', 'Smartphone and UPI safety', 'W S', 'Y', 0, 'Fraud cases: safe or not'],
  ['Tech and AI', 'WhatsApp and video calls for seniors', 'S', 'R', 0, 'Screenshots of each task done'],
  ['Tech and AI', 'Online banking and pension for seniors', 'S', 'Y', 0, 'Safe-or-not cases and steps'],
  ['Tech and AI', 'DigiLocker, Aadhaar and online forms', 'W S', 'Y', 0, 'Steps for each service, in order'],
  ['Tech and AI', 'AI helpers for everyday life (seniors)', 'S', 'Y', 0, 'Everyday questions asked to AI'],

  ['Work and career', 'Excel', 'C W', 'F', 1, 'Filled spreadsheet files'],
  ['Work and career', 'Google Sheets', 'C W', 'F', 0, 'Sheet links'],
  ['Work and career', 'PowerPoint and presentations', 'C W', 'F', 0, 'Slide decks'],
  ['Work and career', 'Resume and LinkedIn', 'C W', 'F', 1, 'Resume file and profile text'],
  ['Work and career', 'Job search strategy', 'C W', 'Y', 0, 'A target list and applications'],
  ['Work and career', 'Interview preparation', 'C W', 'Y', 1, 'Written STAR answers'],
  ['Work and career', 'Workplace email etiquette', 'C W', 'Y', 0, 'Replies to real scenarios'],
  ['Work and career', 'Communication at work', 'C W', 'Y', 0, 'Replies and updates for real cases'],
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
  ['Work and career', 'HR and recruitment basics', 'C W', 'F', 0, 'Job posts, screening notes, offer letters'],
  ['Work and career', 'Virtual assistant and office admin', 'C W', 'F', 0, 'Schedules, trackers, emails'],
  ['Work and career', 'Event management', 'C W', 'F', 0, 'An event plan, budget and run sheet'],
  ['Work and career', 'Study abroad: SOP and applications', 'T C', 'Y', 0, 'SOP drafts and a shortlist'],

  ['Business and freelancing', 'Start a small business: business plan', 'C W', 'F', 0, 'A one-page plan and numbers'],
  ['Business and freelancing', 'Freelancing: find your first clients', 'C W', 'F', 0, 'Profile, portfolio and proposals'],
  ['Business and freelancing', 'Sell online on Amazon, Flipkart and Meesho', 'C W', 'F', 0, 'Listings and a launch plan'],
  ['Business and freelancing', 'Sell from home on WhatsApp and Instagram', 'C W', 'F', 0, 'Catalogue, posts and replies'],
  ['Business and freelancing', 'Pricing your product or service', 'C W', 'F', 0, 'A price sheet with your costs'],
  ['Business and freelancing', 'Bookkeeping and Tally basics', 'C W', 'F', 0, 'Ledgers and entries'],
  ['Business and freelancing', 'GST basics for small business', 'W', 'Y', 0, 'Invoice and return exercises'],
  ['Business and freelancing', 'Start a tuition or coaching class', 'C W', 'F', 0, 'A plan, fee sheet and first batch'],

  ['Money', 'Budgeting and money basics', 'T C W', 'F', 0, 'A real monthly budget'],
  ['Money', 'Personal finance: saving, insurance and loans', 'C W', 'Y', 0, 'Your own plan, case by case'],
  ['Money', 'How the stock market works', 'C W', 'Y', 0, 'Concept questions and paper cases'],
  ['Money', 'Mutual funds and SIP basics', 'C W', 'Y', 0, 'Concept questions and paper cases'],
  ['Money', 'Credit score and loans', 'C W', 'Y', 0, 'Case answers'],
  ['Money', 'Income tax return basics', 'C W', 'Y', 0, 'Worked returns for sample cases'],
  ['Money', 'Safe savings for seniors: FD, pension, schemes', 'S', 'Y', 0, 'Case answers and a savings list'],
  ['Money', 'Money for kids: pocket money and saving', 'K2', 'P', 0, 'Saving charts and money pages'],

  ['English', 'Spoken English', 'T C W', 'V', 1, 'Daily recordings of guided speaking'],
  ['English', 'English grammar', 'K2 T C W', 'Y', 0, 'Exercises and own sentences'],
  ['English', 'Vocabulary builder', 'K2 T C W', 'Y', 0, 'Word use in own sentences'],
  ['English', 'English pronunciation', 'K2 T C W', 'V', 0, 'Recordings of word and sentence drills'],
  ['English', 'Business English and email writing', 'C W', 'Y', 0, 'Real-situation emails'],
  ['English', 'IELTS preparation', 'C W', 'Y', 0, 'Writing tasks and speaking answers'],
  ['English', 'English speaking for kids', 'K1 K2', 'V', 0, 'Recordings of short talks'],
  ['English', 'Reading comprehension', 'K1 K2 T', 'P', 1, 'Answers to passage questions'],
  ['English', 'Spoken English for seniors', 'S', 'V', 0, 'Recordings of everyday conversations'],

  ['Talking and people skills', 'How to talk to anyone', 'T C W S', 'V', 0, 'Recorded practice conversations'],
  ['Talking and people skills', 'Public speaking', 'T C W', 'V', 0, 'Recorded speeches with written outlines'],
  ['Talking and people skills', 'Interview speaking practice', 'C W', 'V', 1, 'Recorded answers to interview questions'],
  ['Talking and people skills', 'Small talk and networking', 'C W', 'V', 0, 'Recorded openers and follow-ups'],
  ['Talking and people skills', 'Confident phone and video calls', 'C W', 'V', 0, 'Recorded calls for real situations'],
  ['Talking and people skills', 'Storytelling that holds attention', 'C W', 'V', 0, 'Recorded stories'],
  ['Talking and people skills', 'Anchoring and compering', 'T C W', 'V', 0, 'Recorded scripts for events'],
  ['Talking and people skills', 'Debating', 'T C', 'V', 0, 'Recorded arguments and rebuttals'],
  ['Talking and people skills', 'Listening skills', 'T C W', 'Y', 0, 'Summaries and replies to real cases'],
  ['Talking and people skills', 'Body language', 'T C W', 'Y', 0, 'Situation answers'],
  ['Talking and people skills', 'Saying no politely: assertiveness', 'T C W', 'Y', 0, 'Replies for real situations'],
  ['Talking and people skills', 'Difficult conversations and conflict', 'C W', 'Y', 0, 'Scripts for real cases'],
  ['Talking and people skills', 'Persuasion and influence', 'C W', 'Y', 0, 'Pitches and replies to objections'],
  ['Talking and people skills', 'Etiquette and good manners for adults', 'T C W', 'Y', 0, 'Situation answers'],

  ['Languages', 'Spoken Hindi for beginners', 'T C W S', 'Y', 0, 'Dialogues and answers, typed'],
  ['Languages', 'Hindi vyakaran', 'K2 T', 'P', 0, 'Grammar exercises'],
  ['Languages', 'Sanskrit basics', 'K2 T C S', 'P', 0, 'Script and simple sentences'],
  ['Languages', 'Spoken Tamil basics', 'T C W S', 'Y', 0, 'Dialogues and answers, typed'],
  ['Languages', 'Spoken Telugu basics', 'T C W S', 'Y', 0, 'Dialogues and answers, typed'],
  ['Languages', 'Spoken Kannada basics', 'T C W S', 'Y', 0, 'Dialogues and answers, typed'],
  ['Languages', 'Spoken Malayalam basics', 'T C W S', 'Y', 0, 'Dialogues and answers, typed'],
  ['Languages', 'Spoken Bengali basics', 'T C W S', 'Y', 0, 'Dialogues and answers, typed'],
  ['Languages', 'Spoken Marathi basics', 'T C W S', 'Y', 0, 'Dialogues and answers, typed'],
  ['Languages', 'Spoken Gujarati basics', 'T C W S', 'Y', 0, 'Dialogues and answers, typed'],
  ['Languages', 'Spoken Punjabi basics', 'T C W S', 'Y', 0, 'Dialogues and answers, typed'],
  ['Languages', 'Urdu for beginners', 'T C W S', 'Y', 0, 'Dialogues and answers, typed'],
  ['Languages', 'Spanish for beginners', 'T C W', 'Y', 0, 'Exercises and dialogues, typed'],
  ['Languages', 'French for beginners', 'T C W', 'Y', 0, 'Exercises and dialogues, typed'],
  ['Languages', 'German for beginners', 'T C W', 'Y', 0, 'Exercises and dialogues, typed'],
  ['Languages', 'Japanese for beginners', 'T C W', 'Y', 0, 'Exercises and dialogues, typed'],
  ['Languages', 'Korean for beginners', 'T C W', 'Y', 0, 'Exercises and dialogues, typed'],
  ['Languages', 'Mandarin Chinese for beginners', 'T C W', 'Y', 0, 'Exercises and dialogues, typed'],
  ['Languages', 'Arabic for beginners', 'T C W', 'Y', 0, 'Exercises and dialogues, typed'],
  ['Languages', 'Russian for beginners', 'T C W', 'Y', 0, 'Exercises and dialogues, typed'],
  ['Languages', 'Italian for beginners', 'T C W', 'Y', 0, 'Exercises and dialogues, typed'],
  ['Languages', 'Portuguese for beginners', 'T C W', 'Y', 0, 'Exercises and dialogues, typed'],
  ['Languages', 'Indian Sign Language basics', 'T C W S', 'Y', 0, 'Sign descriptions and situation answers'],
  ['Languages', 'Translation practice, Hindi–English', 'T C W', 'Y', 0, 'Translated passages'],

  ['Content and creators', 'Start and grow a YouTube channel', 'T C W', 'F', 0, 'Channel plan, scripts and videos, by link'],
  ['Content and creators', 'Instagram reels that people watch', 'T C W', 'F', 0, 'Hooks, scripts and reels, by link'],
  ['Content and creators', 'Personal branding on LinkedIn', 'C W', 'F', 0, 'Profile and posts'],
  ['Content and creators', 'Blogging and content writing', 'T C W', 'Y', 0, 'Articles'],
  ['Content and creators', 'Podcasting', 'C W', 'V', 0, 'Recorded episodes'],
  ['Content and creators', 'Voice-over and dubbing', 'T C W', 'V', 0, 'Recorded scripts'],
  ['Content and creators', 'Stand-up comedy and humour writing', 'T C W', 'V', 0, 'Written bits and recorded sets'],

  ['School subjects', 'Geography', 'K2 T', 'P', 0, 'Map work and answers'],
  ['School subjects', 'Geology and earth science', 'T C', 'P', 0, 'Diagrams and answers'],
  ['School subjects', 'Indian history', 'K2 T', 'P', 0, 'Timelines and answers'],
  ['School subjects', 'World history', 'T C', 'P', 0, 'Timelines and answers'],
  ['School subjects', 'Civics and political science', 'K2 T', 'P', 0, 'Answers and case questions'],
  ['School subjects', 'Economics basics', 'T C', 'P', 0, 'Answers and graphs'],
  ['School subjects', 'Science concepts, class 6–10', 'K2 T', 'P', 0, 'Explain-and-draw pages'],
  ['School subjects', 'Science experiments journal', 'K2 T', 'R', 0, 'Photos and observations'],
  ['School subjects', 'Physics, class 11–12', 'T', 'P', 0, 'Worked problems'],
  ['School subjects', 'Chemistry, class 11–12', 'T', 'P', 0, 'Worked problems and equations'],
  ['School subjects', 'Biology, class 11–12', 'T', 'P', 0, 'Diagrams and answers'],
  ['School subjects', 'Maths, class 11–12', 'T', 'P', 0, 'Worked steps on paper'],
  ['School subjects', 'Accountancy, class 11–12', 'T', 'P', 0, 'Journal entries and accounts'],
  ['School subjects', 'Business studies, class 11–12', 'T', 'P', 0, 'Case answers'],
  ['School subjects', 'Computer science for school', 'K2 T', 'F', 0, 'Code and answers'],
  ['School subjects', 'Environmental science', 'K2 T C', 'P', 0, 'Projects and answers'],
  ['School subjects', 'Astronomy and space', 'K2 T C W', 'P', 0, 'Sky logs and answers'],
  ['School subjects', 'Psychology basics', 'T C W', 'Y', 0, 'Concept answers and real examples'],
  ['School subjects', 'Philosophy for beginners', 'T C W', 'Y', 0, 'Short reasoned answers'],
  ['School subjects', 'General knowledge', 'K2 T C', 'Y', 0, 'Quiz answers'],

  ['Exams', 'Board exam answer writing', 'T', 'P', 0, 'Answers checked on board pattern'],
  ['Exams', 'Notes making', 'K2 T C', 'P', 0, 'Chapter notes'],
  ['Exams', 'JEE and NEET study plan', 'T', 'Y', 0, 'A study plan and practice logs'],
  ['Exams', 'UPSC preparation: plan and answer writing', 'C W', 'P', 0, 'Answers and a study plan'],
  ['Exams', 'SSC and bank exam preparation', 'C W', 'Y', 0, 'Timed question sets'],
  ['Exams', 'Olympiad preparation, maths and science', 'K2 T', 'P', 0, 'Worked problems'],
  ['Exams', 'Aptitude and reasoning for exams', 'T C', 'Y', 0, 'Timed question sets'],
  ['Exams', 'Current affairs for exams', 'C W', 'Y', 0, 'Quiz answers and short notes'],

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

  ['Handwriting', 'English handwriting (print)', 'K1 K2 T', 'P', 1, 'Written pages; every letter scored'],
  ['Handwriting', 'Cursive writing', 'K2 T', 'P', 1, 'Joined-letter pages'],
  ['Handwriting', 'Hindi sulekh: varnamala, matra, barakhadi', 'K1 K2', 'P', 1, 'Devanagari practice pages'],
  ['Handwriting', 'Calligraphy and brush lettering', 'T C W', 'P', 1, 'Stroke and alphabet sheets'],
  ['Handwriting', 'Speed writing for board exams', 'T', 'P', 1, 'Timed passages'],

  ['Writing', 'Essay writing', 'K2 T C', 'P', 1, 'Handwritten or typed essays'],
  ['Writing', 'Letter and application writing', 'K2 T', 'P', 1, 'Formal and informal letters'],
  ['Writing', 'Creative writing and stories', 'K2 T C W', 'Y', 0, 'Own stories, chapter by chapter'],
  ['Writing', 'Poetry writing', 'T C W S', 'Y', 0, 'Poems with form exercises'],
  ['Writing', 'Journaling', 'T C W S', 'P', 0, 'Guided journal pages'],
  ['Writing', 'Write your life story', 'S', 'Y', 0, 'Chapters of your story'],

  ['Maths and thinking', 'School maths, class 1–5', 'K1 K2', 'P', 1, 'Worked steps on paper'],
  ['Maths and thinking', 'School maths, class 6–10', 'K2 T', 'P', 0, 'Worked steps on paper'],
  ['Maths and thinking', 'Times tables and mental maths', 'K2', 'P', 1, 'Drill pages'],
  ['Maths and thinking', 'Abacus', 'K1 K2', 'P', 0, 'Bead pictures and sums'],
  ['Maths and thinking', 'Vedic maths', 'K2 T C', 'P', 0, 'Shortcut practice pages'],
  ['Maths and thinking', 'Word problems', 'K2 T', 'P', 1, 'Two-step problems with working'],
  ['Maths and thinking', 'Logic and number puzzles', 'K2 T C W S', 'P', 1, 'Sudoku, logic grids, crosswords'],
  ['Maths and thinking', 'Chess tactics', 'K2 T C W S', 'Y', 0, 'Moves for diagram puzzles'],
  ['Maths and thinking', 'Critical thinking and problem solving', 'T C W', 'Y', 0, 'Case questions with reasoning'],
  ['Maths and thinking', 'Data interpretation', 'T C W', 'Y', 0, 'Chart and table questions'],
  ['Maths and thinking', 'Decision making', 'T C W', 'Y', 0, 'Real decisions, reasoned on paper'],
  ['Maths and thinking', 'Brain fitness for seniors', 'S', 'P', 0, 'Memory and puzzle pages'],

  ['Games, puzzles and quizzes', 'English word antakshari', 'K2 T C W S', 'Y', 0, 'Word chains, typed'],
  ['Games, puzzles and quizzes', 'Wordplay: puns, anagrams and riddles', 'K2 T C W', 'Y', 0, 'Puzzles solved and your own made'],
  ['Games, puzzles and quizzes', 'Scrabble and word games', 'K2 T C W S', 'Y', 0, 'Best moves for board positions'],
  ['Games, puzzles and quizzes', 'Crosswords', 'T C W S', 'P', 0, 'Solved grids'],
  ['Games, puzzles and quizzes', 'Quizzing', 'K2 T C W S', 'Y', 0, 'Quiz rounds answered and written'],
  ['Games, puzzles and quizzes', 'Spelling bee', 'K2', 'Y', 0, 'Spelling rounds, typed'],
  ['Games, puzzles and quizzes', 'Riddles and lateral thinking', 'K2 T', 'Y', 0, 'Riddles solved and explained'],
  ['Games, puzzles and quizzes', 'Rubik\'s cube', 'K2 T C', 'Y', 0, 'Moves and solve times'],
  ['Games, puzzles and quizzes', 'Magic tricks', 'K2 T', 'Y', 0, 'Tricks explained step by step'],

  ['Art and creativity', 'Drawing basics', 'K1 K2 T C', 'P', 0, 'Step-by-step drawings'],
  ['Art and creativity', 'Sketching and shading', 'K2 T C W', 'P', 0, 'Shading studies'],
  ['Art and creativity', 'Cartoons and comics', 'K2 T C', 'P', 0, 'Panels and characters'],
  ['Art and creativity', 'Colour theory and painting', 'K2 T C W S', 'R', 0, 'Photo of paintings'],
  ['Art and creativity', 'Rangoli and mandala', 'K2 T W S', 'P', 1, 'Dot-grid designs, symmetry checked'],
  ['Art and creativity', 'Mehndi design', 'T C W', 'P', 0, 'Design sheets'],
  ['Art and creativity', 'Doodle art', 'K2 T C', 'P', 0, 'Doodle pages'],
  ['Art and creativity', 'Craft and origami', 'K1 K2 T', 'R', 1, 'Photo of the made piece'],
  ['Art and creativity', 'Mobile photography', 'T C W S', 'F', 0, 'Photos taken for each brief'],
  ['Art and creativity', 'Graphic design with Canva', 'T C W', 'F', 0, 'Posters and posts, exported'],
  ['Art and creativity', 'Fashion sketching', 'T C W', 'P', 0, 'Figure and garment sketches'],
  ['Art and creativity', 'Interior decoration on a budget', 'C W', 'R', 0, 'Before-and-after photos'],
  ['Art and creativity', 'Storytelling aloud', 'K1 K2 T', 'V', 0, 'Recorded stories'],

  ['Music, dance and acting', 'Singing basics', 'K2 T C W S', 'V', 0, 'Recorded exercises and songs'],
  ['Music, dance and acting', 'Music theory and notation', 'K2 T C W', 'P', 0, 'Written notation exercises'],
  ['Music, dance and acting', 'Guitar for beginners', 'T C W', 'V', 0, 'Recorded chords and songs'],
  ['Music, dance and acting', 'Keyboard and piano', 'K2 T C W', 'V', 0, 'Recorded pieces'],
  ['Music, dance and acting', 'Harmonium for bhajans', 'T W S', 'V', 0, 'Recorded bhajans'],
  ['Music, dance and acting', 'Tabla basics', 'K2 T C', 'V', 0, 'Recorded bols and thekas'],
  ['Music, dance and acting', 'Flute (bansuri) basics', 'T C W', 'V', 0, 'Recorded notes and tunes'],
  ['Music, dance and acting', 'Dance basics: Bollywood and freestyle', 'K2 T C', 'F', 0, 'Dance videos, by link'],
  ['Music, dance and acting', 'Acting basics', 'K2 T C', 'V', 0, 'Recorded scenes'],

  ['Sports and fitness', 'Cricket: batting and bowling basics', 'K2 T C', 'P', 0, 'Drill logs and answers'],
  ['Sports and fitness', 'Football skills', 'K2 T', 'P', 0, 'Drill logs and answers'],
  ['Sports and fitness', 'Badminton', 'K2 T C W', 'P', 0, 'Drill logs and answers'],
  ['Sports and fitness', 'Table tennis', 'K2 T C W', 'P', 0, 'Drill logs and answers'],
  ['Sports and fitness', 'Prepare for school sports trials', 'K2 T', 'P', 0, 'Training logs'],
  ['Sports and fitness', 'Police and army physical test preparation', 'T C', 'P', 0, 'Training logs and test times'],
  ['Sports and fitness', 'Running: from zero to 5 km', 'T C W', 'P', 0, 'Run logs'],
  ['Sports and fitness', 'Home workout without equipment', 'T C W', 'P', 0, 'Workout logs'],
  ['Sports and fitness', 'Strength training in the gym', 'C W', 'P', 0, 'Workout logs'],
  ['Sports and fitness', 'Yoga for beginners', 'T C W', 'P', 0, 'Practice logs'],
  ['Sports and fitness', 'Gentle yoga for seniors', 'S', 'P', 0, 'Practice logs'],
  ['Sports and fitness', 'Self-defence basics', 'T C W', 'Y', 0, 'Situation answers and drill logs'],

  ['Health and wellbeing', 'Nutrition and healthy eating', 'T C W S', 'P', 0, 'Food logs and meal plans'],
  ['Health and wellbeing', 'First aid basics', 'T C W S', 'Y', 0, 'What-to-do answers for real cases'],
  ['Health and wellbeing', 'Stress management', 'T C W S', 'P', 0, 'Practice logs'],
  ['Health and wellbeing', 'Meditation for beginners', 'T C W S', 'P', 0, 'Practice logs'],
  ['Health and wellbeing', 'Sleep better', 'C W S', 'P', 0, 'Sleep logs'],
  ['Health and wellbeing', 'Mental health self-care', 'T C W', 'P', 0, 'Reflection pages'],
  ['Health and wellbeing', 'Posture and back care for desk workers', 'C W', 'P', 0, 'Habit logs'],
  ['Health and wellbeing', 'Skin care and grooming', 'T C W', 'P', 0, 'Routine logs'],
  ['Health and wellbeing', 'Emotional intelligence', 'K2 T C W', 'Y', 1, 'Reflection exercises'],
  ['Health and wellbeing', 'Mindfulness journaling', 'T C W S', 'P', 1, 'Gratitude and feelings pages'],

  ['Life skills', 'Study skills and memory techniques', 'K2 T C', 'Y', 0, 'Notes and recall tests'],
  ['Life skills', 'Speed reading', 'T C W', 'Y', 0, 'Reading speed and recall tests'],
  ['Life skills', 'Time management', 'T C W', 'P', 0, 'Weekly plans, filled in'],
  ['Life skills', 'Goal setting and habits', 'T C W', 'P', 1, 'Habit trackers'],
  ['Life skills', 'Cooking basics', 'T C W', 'R', 0, 'Photo of each dish'],
  ['Life skills', 'Baking basics', 'T C W', 'R', 0, 'Photo of each bake'],
  ['Life skills', 'Kitchen gardening', 'K2 T W S', 'R', 0, 'Plant photos over weeks'],
  ['Life skills', 'Home organisation', 'C W', 'R', 0, 'Before-and-after photos'],
  ['Life skills', 'Basic home repairs, done safely', 'C W', 'R', 0, 'Photos of each fix'],
  ['Life skills', 'Sewing basics', 'T W S', 'R', 0, 'Photos of seams and stitches'],
  ['Life skills', 'Knitting and crochet', 'T W S', 'R', 0, 'Photos of each piece'],
  ['Life skills', 'Embroidery', 'T W S', 'R', 0, 'Photos of each stitch sample'],
  ['Life skills', 'Makeup basics', 'T C W', 'R', 0, 'Photos of each look'],
  ['Life skills', 'Pet care', 'K2 T C W', 'P', 0, 'Care charts and answers'],
  ['Life skills', 'Living on your own: hostel and first flat', 'T C', 'Y', 0, 'Plans and answers for real cases'],
  ['Life skills', 'Personal safety for women', 'T C W', 'Y', 0, 'Situation answers'],

  ['Parenting and family', 'Positive parenting', 'W', 'Y', 0, 'Situation plans for home'],
  ['Parenting and family', 'Parenting toddlers (1 to 5)', 'W', 'Y', 0, 'Daily plans and situation answers'],
  ['Parenting and family', 'Parenting teenagers', 'W', 'Y', 0, 'Conversation plans for real cases'],
  ['Parenting and family', 'Screen time: a family plan', 'W', 'P', 0, 'A family media plan and logs'],
  ['Parenting and family', 'Help your child study at home', 'W', 'Y', 0, 'Study plans and session notes'],
  ['Parenting and family', 'Caring for a new baby', 'W', 'Y', 0, 'Routines and what-to-do answers'],
  ['Parenting and family', 'Caring for elderly parents', 'W', 'Y', 0, 'Care plans and answers'],
  ['Parenting and family', 'Relationship communication for couples', 'C W', 'Y', 0, 'Conversation plans'],
  ['Parenting and family', 'Grandparents: stay close to grandchildren', 'S', 'Y', 0, 'Activities planned and done'],
  ['Parenting and family', 'Body safety for kids: good touch, bad touch', 'K1 K2', 'P', 0, 'Picture pages done with a parent'],

  ['Travel', 'The art of travelling: plan a great trip', 'T C W S', 'F', 0, 'A full trip plan'],
  ['Travel', 'Budget travel and backpacking', 'C W', 'F', 0, 'A budget trip plan'],
  ['Travel', 'Solo travel, safely', 'C W', 'Y', 0, 'Plans and answers for real cases'],
  ['Travel', 'Travel abroad: passport, visa and packing', 'C W S', 'Y', 0, 'Checklists and steps'],
  ['Travel', 'Family trips with kids', 'W', 'F', 0, 'A family trip plan'],
  ['Travel', 'Pilgrimage trip planning', 'W S', 'F', 0, 'A yatra plan'],
  ['Travel', 'Trekking and camping basics', 'T C W', 'Y', 0, 'Gear lists and plans'],
  ['Travel', 'Become a tour guide', 'C W', 'V', 0, 'Recorded tours'],

  ['Law, rights and civics', 'Know your rights: the Indian Constitution', 'T C W S', 'Y', 0, 'Case answers'],
  ['Law, rights and civics', 'Human rights basics', 'T C W', 'Y', 0, 'Case answers'],
  ['Law, rights and civics', 'Consumer rights and how to complain', 'C W S', 'Y', 0, 'Complaints written for real cases'],
  ['Law, rights and civics', 'RTI: ask the government for information', 'C W S', 'Y', 0, 'RTI applications drafted'],
  ['Law, rights and civics', 'Women\'s rights and safety laws', 'T C W', 'Y', 0, 'Case answers'],
  ['Law, rights and civics', 'Workers\' rights: salary, PF and leave', 'C W', 'Y', 0, 'Case answers'],
  ['Law, rights and civics', 'Police, FIR and your rights', 'C W S', 'Y', 0, 'Case answers'],
  ['Law, rights and civics', 'Rent agreements and tenant rights', 'C W', 'Y', 0, 'Clauses checked for sample cases'],
  ['Law, rights and civics', 'Cyber law and online safety', 'T C W', 'Y', 0, 'Case answers'],
  ['Law, rights and civics', 'Road rules and driving licence test', 'T C W', 'Y', 0, 'Test-style answers'],

  ['Leadership and public life', 'Steps to become a leader', 'T C W', 'Y', 0, 'Leadership tasks done and reflected on'],
  ['Leadership and public life', 'First-time manager', 'W', 'Y', 0, 'Plans and scripts for real team cases'],
  ['Leadership and public life', 'Teamwork and collaboration', 'T C W', 'Y', 0, 'Case answers'],
  ['Leadership and public life', 'Running a good meeting', 'W', 'F', 0, 'Agendas and minutes'],
  ['Leadership and public life', 'How politics and elections work', 'T C W S', 'Y', 0, 'Case answers'],
  ['Leadership and public life', 'Political skills: campaigning and public life', 'C W', 'F', 0, 'A campaign plan and speeches'],
  ['Leadership and public life', 'Student council and school elections', 'T', 'F', 0, 'A campaign plan and speech'],
  ['Leadership and public life', 'Panchayat, ward and local government', 'C W S', 'Y', 0, 'Case answers and a ward plan'],
  ['Leadership and public life', 'Community work and volunteering', 'T C W S', 'F', 0, 'A project plan and report'],

  ['For teachers, trainers and coaches', 'Classroom management', 'W', 'Y', 0, 'Plans for real class situations'],
  ['For teachers, trainers and coaches', 'Lesson planning', 'W', 'F', 0, 'Lesson plans'],
  ['For teachers, trainers and coaches', 'Teaching with AI tools', 'W', 'F', 0, 'Lessons and materials made with AI'],
  ['For teachers, trainers and coaches', 'Online teaching and tuition', 'W', 'F', 0, 'A recorded or planned online class'],
  ['For teachers, trainers and coaches', 'Teaching children who learn differently', 'W', 'Y', 0, 'Support plans for sample learners'],
  ['For teachers, trainers and coaches', 'Coaching skills: coaching conversations', 'W', 'Y', 0, 'Coaching scripts and session notes'],
  ['For teachers, trainers and coaches', 'Sports coaching basics', 'W', 'F', 0, 'Session plans'],
  ['For teachers, trainers and coaches', 'Gym trainers: program design for clients', 'W', 'F', 0, 'Client programs'],
  ['For teachers, trainers and coaches', 'Gym trainers: nutrition coaching basics', 'W', 'F', 0, 'Client meal guides'],
  ['For teachers, trainers and coaches', 'Gym trainers: client communication and sales', 'W', 'V', 0, 'Recorded consultations'],
  ['For teachers, trainers and coaches', 'Yoga teachers: plan and lead a class', 'W', 'F', 0, 'Class plans and cue scripts'],
  ['For teachers, trainers and coaches', 'Train the trainer: run a workshop', 'W', 'F', 0, 'A workshop plan and slides'],

  ['Culture and spirituality', 'Hanuman Chalisa: learn and write', 'K2 T W S', 'P', 1, 'Written verses'],
  ['Culture and spirituality', 'Naam jaap writing', 'T W S', 'P', 1, 'Written naam pages'],
  ['Culture and spirituality', 'Aartis and shlokas', 'K2 T W S', 'V', 1, 'Recorded recitation and written meaning'],
  ['Culture and spirituality', 'Ramayan and Mahabharat stories', 'K1 K2', 'P', 1, 'Read, draw and answer pages'],
  ['Culture and spirituality', 'Bhagavad Gita, one shloka a day', 'T C W S', 'P', 0, 'Shloka, meaning, own reflection'],
  ['Culture and spirituality', 'Festivals and traditions of India', 'K1 K2', 'P', 1, 'Activity pages'],
  ['Culture and spirituality', 'Sanskar: values for kids', 'K1 K2', 'P', 1, 'Daily value tasks'],
]

const slug = (s: string) =>
  s.toLowerCase().replace(/[–—]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const WRITING = new Set(['hanuman-chalisa-learn-and-write', 'naam-jaap-writing', 'sanskrit-basics', 'school-maths-class-1-5', 'abacus'])
const WRITING_GROUPS = new Set(['Handwriting', 'Early learning'])

/** Everyday safety skills stay affordable even though they sit under Tech. */
const EVERYDAY = new Set([
  'computer-basics', 'smartphone-and-upi-safety', 'cybersecurity-basics', 'touch-typing', 'ms-word-and-documents',
  'whatsapp-and-video-calls-for-seniors', 'online-banking-and-pension-for-seniors', 'digilocker-aadhaar-and-online-forms', 'ai-helpers-for-everyday-life-seniors',
])
const CAREER_GROUPS = new Set(['Work and career', 'Tech and AI', 'Business and freelancing', 'Content and creators', 'For teachers, trainers and coaches'])
const bandOf = (id: string, group: string, ages: Age[]): Band =>
  group === 'Early learning' || ages.every((a) => a === 'kids-3-7' || a === 'kids-8-12')
    ? 'kids'
    : EVERYDAY.has(id) || !CAREER_GROUPS.has(group)
      ? 'life'
      : 'career'

export const SKILLS: Skill[] = ROWS.map(([group, name, ages, proof, weSell, handIn]) => {
  const a = ages.split(' ').map((x) => A[x])
  const id = slug(name)
  return { id, group, name, ages: a, proof: P[proof], handIn, weSell: weSell === 1, band: bandOf(id, group, a), writing: WRITING.has(id) || WRITING_GROUPS.has(group) }
})

export const skillById = (id: string) => SKILLS.find((s) => s.id === id)

/** The shelves, in the order the shop shows them. */
export const GROUPS = [...new Set(SKILLS.map((s) => s.group))]
