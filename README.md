# Learn with AI

**A workbook written just for you, for any skill and any age, with help when you are stuck and a fair check at the end.**

A learner tells the AI who they are and what they want to learn. The AI writes a workbook just for them, helps whenever they are stuck, checks the finished work and awards a skill badge. If the work is not there yet, it writes a short fix-up workbook for the gaps. One engine serves **309 listed skills**, and any other safe skill a learner names, for every age: from three-year-olds learning to hold a pencil to job-seekers learning Power BI, gym trainers planning client programmes, and grandparents learning to spot a UPI scam.

Built by [GrowthGoal](https://growthgoal.in), an Indian learning shop, for the **Meta Global AI Developer Hackathon 2026**, on the **Meta Model API**: Muse Spark, Muse Image, SAM 3.1 and Muse Voice Transcribe.

**Demo video (3 min): https://youtu.be/ysKWsq9ADbA**

Live: **https://growthgoal.in/learn**

Every AI call in this repository goes to the Meta Model API, through one client ([`api/src/meta.ts`](api/src/meta.ts)) that also logs what each call costs.

| | |
|---|---|
| ![Home: search 309 skills, filter by age](docs/home.jpg) | ![A learner's own workbook, cover by Muse Image](docs/workbook.jpg) |
| ![SAM 3.1 finds every letter; one B floats above the line](docs/sam-letters.jpg) | ![A skill badge with skill points](docs/badge.jpg) |

![The checker reads a spreadsheet cell by cell and quotes the cell back](docs/check.jpg)

<sub>Screens from the running app. Priya and Aarav are demo learners; Aarav's page is a sample made for the demo, and SAM's boxes and the check on it are real output.</sub>

---

## Why

Everyone is learning something: a six-year-old's first letters, a grandmother's first safe UPI payment, the spreadsheet that runs a family shop, the answer a student will give at an interview. We learn best when the lesson is about our own life (our examples, our language, our pace) and when we can see ourselves getting better.

GrowthGoal's idea is simple: grow a little every day. Learn with AI makes that possible for anyone. It keeps what makes a workbook work, doing the task yourself on paper or on screen, and adds three things: a workbook written for you, help at the moment you are stuck, and an honest check that ends in a badge. It works beside the people who help us grow, such as parents, teachers and coaches, and costs about the price of a book.

## How it works

1. **Tell the AI about you.** Each skill has its own short form (written once by Muse Spark, so filling it costs nothing): who is learning, their goal, where they are now, what goes wrong, minutes a day, what they love, and anything else. Muse Spark then reads it once and asks at most a few follow-up questions, in English, Hindi or Hinglish, before it writes.
   Don't see your skill? Name it. One Muse Spark call checks it is safe and legal to teach (it turns down weapons, hacking, cheating, licensed work like surgery, and suggests something close), gives it a name, a shelf, a price band and its own form. Asked again, it costs nothing.
2. **Get your workbook.** Muse Spark writes it to a strict JSON schema: chapters, short lessons, worked examples, graded tasks, a final task, a daily plan, and a rubric for every task. Muse Image draws a cover for this learner. It prints as a PDF (dotted trace rows drawn from the font's own outline, Hindi shaped correctly) and lives online.
3. **Stuck? Ask.** Our AI teacher (Muse Spark) explains the task another way, as often as the learner needs within the level's question allowance, and never does the task for them. Each task also carries a copy-ready prompt, plain text the learner can take to any AI assistant they already use for unlimited free help; the app itself calls no AI but Meta's.
4. **Hand it in.** Photos of the pages, a spreadsheet or code file, a photo of what they made, a voice recording, or typed answers.
5. **Get checked, earn the badge.** The checker marks every task against its rubric and quotes exact evidence back. Pass: a shareable badge listing what the learner can now do, and skill points (Basic 100, Advanced 250, Pro 500, Expert 750, Master 1000, times the score; each skill and level counts once) on a leaderboard by month, age group and shelf that shows first names only. Not yet: a free fix-up workbook for just the gaps.

```mermaid
flowchart LR
  A0[Skill form<br/>no AI] --> A[A few follow-up questions<br/>Muse Spark, one call]
  A --> B[Workbook writer<br/>Muse Spark + JSON schema]
  B --> C[Cover art<br/>Muse Image]
  B --> D[PDF + online copy]
  D --> E[Learner works<br/>Stuck? teacher, Muse Spark]
  E --> F{Hand in}
  F -->|page photos| G[SAM 3.1 letter boxes<br/>+ Muse Spark vision]
  F -->|recording| H[Muse Voice Transcribe<br/>+ pace and fillers]
  F -->|spreadsheet, code| I[Cell-by-cell reading]
  F -->|typed| J[Text]
  G & H & I & J --> K[Marking by rubric<br/>Muse Spark]
  K -->|pass| L[Skill badge]
  K -->|not yet| M[Fix-up workbook]
```

### Five levels, a ladder

Basic, Advanced, Pro, Expert and Master are steps, not five products. Basic is open to everyone and is worth it on its own: its final task is a real result in the learner's own life (their own billing sheet, their own business plan, their own interview introduction). Each level opens only with the badge of the level before it in the same skill (Advanced with Basic, Pro with Advanced, and so on up to Master); the server checks the badge. Each level is written from the workbook that earned the badge and from its check, so it starts by polishing what the check found weak, then goes a level harder. Pro aims at doing the whole skill well alone; Expert at the hard and unusual cases; Master at the learner's own large project and teaching the skill to someone else. Every workbook ends with a quick-reference page worth keeping.

## How each Meta model is used

| Model | What it does here |
|---|---|
| **Muse Spark 1.3** | Writes each skill's form once, and sets up any skill a learner names; asks the few follow-up questions; writes every workbook to a JSON schema (structured output); the patient "Stuck?" teacher; reads page photos and marks them against each task's rubric (vision, up to 50 images in one call). |
| **SAM 3.1** | On handwriting pages, segments every letter. From the boxes we measure each letter's lift above the line, height spread and spacing, so feedback says "the first B in row 4 floats 56% above the line", not "be neater". |
| **Muse Voice Transcribe** | Speaking skills (spoken English, pronunciation, public speaking, interview answers, recitation): the transcript plus words per minute and filler words go to the checker. |
| **Muse Image** | A cover picture for each learner's workbook, from their interests (a six-year-old who loves cricket and dinosaurs gets both). |

We call the **Standard** models only, never the Contributor variants: learners include children, and their work must not be used for training.

## What it costs a learner

Measured on real runs (`output/usage.jsonl` logs every paid call):

| Step | AI cost |
|---|---|
| Skill form | free (written once per skill) |
| Follow-up questions, one call | ₹0.2 |
| Setting up a skill the learner names | ₹0.3, once per skill |
| Writing a workbook | ₹2–8 (Hindi uses more tokens) |
| Cover picture | ₹0.9 |
| One question to the AI teacher | ₹0.1 |
| Checking a page (with SAM on handwriting) | ₹1.1 |
| Checking a recording | ₹0.6 |

A full workbook level, with the help and the checks included, costs us roughly ₹15–25 in AI. The learner pays once per level, before the AI starts, through the GrowthGoal shop's checkout (Razorpay); the shop tells Learn with AI when it is paid, and only then is anything written. The price covers the AI cost with a 30% safety margin, plus ₹39 to keep the service running. Prices differ by skill: children's skills ₹69–129, life skills ₹79–169, career skills ₹99–199 for Basic, Advanced and Pro, then ₹75 more for Expert and ₹75 more again for Master, never below that cost-plus floor. No subscription. Help from the learner's own AI assistant costs us nothing, which is why it is unlimited.

## Skills

309 skills on 26 shelves, chosen from what people actually look for (WEF Future of Jobs 2025, LinkedIn and Udemy India reports): AI and data, work and career, business and freelancing, money, English, talking and people skills, 24 languages, content creation, school subjects and exams, early learning, handwriting, writing, maths, word games and quizzes, art, music and dance, sports and fitness, health, life skills, parenting, travel, law and rights, leadership and public life, skills for teachers, gym trainers and coaches, and culture. Each is one entry in [`api/src/catalog/skills.ts`](api/src/catalog/skills.ts): who it is for and how the work is proved. No skill has code of its own.

Search understands how people type: word starts, typos ("exel", "public speking"), Hinglish ("angrezi bolna", "kanoon") and Hindi ("पैसे"), from search words Muse Spark wrote once for every skill. Icons are Microsoft's Fluent Emoji (MIT), saved on our own site as cleaned SVG files.

## Safety and privacy

- For a learner under 12, the form asks whether the child or a parent is filling it in; with a parent, every instruction is written for the parent to read aloud. The form never asks for a phone number, address, school or photo of a person.
- There are no accounts. A workbook's code, printed on it with a QR code, is the learner's ticket to help and hand-in; the leaderboard shows first names and age groups only.
- Uploaded photos and recordings are used to check the work and are not stored. Only marks, feedback and badges are kept.
- No ads or tracking on learning pages.
- The teacher explains and never does the task; it declines anything unsafe or off-topic. Law, health and money skills teach general knowledge, never advice on the learner's own case; physical skills put safety first.
- Pages send a strict Content-Security-Policy: no script, frame or plugin from any other site can run on them.
- Each visitor has a daily cap so the AI budget cannot be drained.

## Run it

Needs Node 22, Chrome or Chromium (for PDFs; set `CHROME_PATH` if it is not in the usual place), ffmpeg, and optionally poppler's `pdfinfo` (page counts for printed copies).

```bash
cp .env.example .env                      # paste your Meta Model API key
cd api && npm install && npm start        # API on :4300
```

In a second terminal:

```bash
cd web && npm install && npm run dev      # app on http://localhost:5190/learn
```

Or in one container: `docker build -t learn-with-ai . && docker run -p 4300:4300 --env-file .env learn-with-ai`, then open http://localhost:4300/learn.

Tests (no API key needed): `cd api && npm test` checks skill points and the leaderboard, every skill's form, the age shelves, the level prices, and search with typos, Hinglish and Hindi.

## Layout

```
api/src/catalog    skills, prices, forms, search words, learner-named skills
api/src/workbook   writer (Muse Spark) and PDF renderer
api/src/teach      follow-up questions and the Stuck? teacher
api/src/check      evidence (SAM 3.1, transcription, files) and marking
api/src/meta.ts    Meta Model API client with per-call cost logging
api/src/points.ts  skill points and the leaderboard
api/test           tests
web/src            the learner's app
```

TypeScript throughout: an Express API, a React + Vite + Tailwind app, Chromium (puppeteer-core) for the PDFs, and JSON files for storage.

## Licence

Code: [MIT](LICENSE). Icons in `web/public/icons`: Microsoft's Fluent Emoji, MIT ([their licence](web/public/icons/LICENSE.txt)).

## Team

GrowthGoal, India. GrowthGoal already sells printed and digital workbooks to Indian families; Learn with AI is the same workbook, made personal.
