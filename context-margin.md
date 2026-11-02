# Margin, the teacher app for private universities in Bangladesh

## Users
- **Primary: teachers** (Lecturer to Associate Professor, roughly 28 to 50) at private universities in Bangladesh. Each carries 3 to 4 courses, 100 to 200 students, committee work, thesis supervision and research that decides promotion.
- They open Margin in short gaps: before 9 am, on the bus, between classes, often on a mid-range Android phone over mobile data. A session is 30 seconds to 3 minutes. Long work (grading, writing) happens on a laptop.
- Their goal each morning is "what do I owe today, and to whom". Each trimester it is "get the course file and CLO results in without a scramble". Each year it is "move my promotion forward".
- Today they work from email, WhatsApp groups, portal Excel exports, paper registers and memory. Forgotten promises to students and late course files are the visible failures.
- Time-poor, not tech-poor. Overwhelm comes from many things asking for attention at once, not from any single complex screen.
- Bilingual. The interface is English with a full Bangla toggle (Noto Sans Bengali, Bengali numerals and dates in Bangla mode).
- **Secondary:** the department chair (sees operational counts, signs off), and IQAC and the VC (buy it and see department-level CLO and course-file status). They never see a teacher's private items.

## Product
- Mobile-first web app, a working prototype (v13) in `itshimadry789/Margin_MVP`: `index.html` (teacher app), `lib/compass.js` (Grow / Compass), `lib/growth.js` (Class Insight, trimester report), `pitch.html`, `one-pager.html`. The AI and department API sits behind `/api/*` on the production deployment; offline, the prototype falls back to built-in drafts.
- Four sections: **Today** (what you owe: promises, messages, drafts, the day's schedule, protected writing time), **Make** (question papers, course files, recommendation letters, replies), **Grow / Compass** (promotion gap and ETA, research pipeline, journal finder, formatter, reviewer responses, Friday review, trimester report), **People** (promises, students, colleagues).
- **Core pattern:** Margin does the work, the teacher approves. Every AI output is an approval card with Approve, Edit and Dismiss (`sCard()`), and undo is in the toast.
- Business model: 999 tk per teacher a month, paid by the department or university, with a usage guarantee: "If 30 of 50 teachers aren't using it weekly, you don't pay." First pilot: one department (UIU BBA) for one trimester.
- Stage: pre-pilot prototype. The design source of truth is the running HTML; there is no Figma file.
- Design tokens and components are in `index.html` `:root` and the v9 layer: pastel cards (`--p-yellow`, `--p-blue`, `--p-lav`, `--p-pink`, `--p-orange`), a dark hero (`.g9h`), 22 to 28px radii, Manrope at 800 for headings, a floating pill tab bar on phones.

## Constraints
- **Device and network:** 390px phones first, slow and interrupted connections, older Android WebViews. Desktop at 1366px is second.
- **Integration:** no live portal, LMS or Google Classroom connection. Data arrives as Excel exports and uploads; sign-in is the university's Google or Microsoft account. IT approves without integration work.
- **Accreditation:** course files serve BAC (Bangladesh Accreditation Council) requirements, and CLO and PLO attainment feeds IQAC. The trimester is 14 weeks; say "trimester", not "semester".
- **Team:** small and engineering-led, with no dedicated researcher. Evidence comes from UIU BBA pilot teachers.
- **Regulatory:** Bangladesh data-protection law for student and teacher data; the current requirements are an open question. Student names and marks must not leave the university's tenancy.

## Ethical stance
- **Private by default.** A teacher's notes, promises, inbox, goals and Compass are never shown to the university. Chairs and IQAC see operational counts only, and no teacher is ranked.
- **Utility, not engagement.** No streaks, no guilt counters, no re-engagement notifications. Missed research blocks move and nothing breaks. Success is minutes given back, not time in the app.
- **AI drafts, the teacher decides.** Nothing is sent, filed or shared without an explicit approval. Every AI card says why it exists ("Why this?"). Margin never writes research content; it finds, formats, checks and drafts responses.
- **Honest numbers.** Sample data is labelled. Estimates are shown as estimates. Time-saved figures are estimates per approved item.
- **Every pattern in the anti-pattern catalog is rejected**, including gamified progress that pressures and urgency copy that shames ("Mehnaz is waiting" sits at the edge).
- Approve, edit and dismiss counts are collected as a quality signal and as training data for Margin's own models. Counts only, never the text.

## Success
- A teacher can answer "what do I owe today?" within 5 seconds of opening the app, and clear the first item in 2 taps or fewer.
- 70% or more of AI drafts are approved with light or no edits (pilot target in the app's IQAC view).
- 30 of 50 teachers in a pilot department use it weekly (the commercial guarantee).
- Course files reach 100% by the end of the trimester without a final-week scramble.
- Teachers can say their promotion date and next research step after one visit to Grow.

## Open questions
- What does current Bangladeshi data-protection law require for student marks and teacher activity data, and who at the university is the data controller?
- Do teachers explicitly consent to their approve, edit and dismiss counts being used to train Margin's models, and can they opt out?
- Should the section be called "Grow" or "Compass"? The nav and the page title disagree today.
- Which pilot teachers can join a 5-person usability test of the morning flow on their own phones?

## Artifacts this project makes
- `evaluation-margin.md`: a UX evaluation of the teacher app, because the stated problem is that the app feels overwhelming.
- Fixes to the prototype on a branch, in severity order.
