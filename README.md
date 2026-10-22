# Margin prototype, v12 (frontend)

The teacher app (`index.html`, served at `/` and `/app`), the pitch (`/pitch`) and the one-pager (`/pitch/one-pager`).

This branch holds the frontend only. The AI and department API (`/api/*`) is not in this repository; `vercel.json` forwards `/api/*` to the live production deployment so previews use the real AI.

## What changed in v12
- Habit loop and growth features (Class Insight, trimester teaching report) are on by default. Switch them off in the Prototype panel or with `?habit=off` / `?growth=off`.
- New message everywhere: "Teach better. Grow faster." 999 tk per teacher a month, paid by the department or university. UIU BBA pilot first.
- Data sources described as Excel exports and uploads, with no live portal or Google Classroom connection.
- The guided tour walks the Outcome Loop: Class Insight, then the teaching report.
- The pitch has a new step: CLO attainment after the midterm, and an approved practice quiz.
- Every approve, edit and dismiss on an AI card is counted; the IQAC view shows "AI quality, from teachers' decisions".

## Moving this into the production project
Copy `index.html` over `Margin — Teacher App Prototype v11.html` (or rename it), and copy `pitch.html` and `one-pager.html` into the project that holds `api/`. Keep that project's own `vercel.json`, not the one here.
