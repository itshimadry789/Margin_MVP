# Margin: design context

Read this before any critique, audit, copy review, design-system or handoff task. It is the house context for Margin.

## The product
Margin is a mobile-first web app for teachers at private universities in Bangladesh. Tagline: **"Teach better. Grow faster."** It costs 999 tk per teacher a month, paid by the department or university. The first pilot is the UIU BBA programme.

- **Code:** GitHub `itshimadry789/Margin_MVP`. `index.html` holds the teacher app, `lib/` holds feature modules (`compass.js`, `growth.js`), `pitch.html` and `one-pager.html` hold the sales pages. There is no design tool: **the HTML prototype is the design source of truth.** Review it by running it (the `run` skill, or any static server) and taking screenshots at **390 × 844** and **1366 × 900**.
- **Sections (bottom nav on phone, top pills on desktop):** Today · Make (Teaching) · Grow (Compass) · People. Roles: Teacher (daily user), Department chair (champion), IQAC / VC (buyer), IT (approver).

## Who uses it
- **Teachers, 28 to 50:** Assistant and Associate Professors who carry 3 to 4 courses, 100 to 200 students, committee work and research. They usually open it on a mid-range Android phone between classes, on the bus or before 9 am, often on mobile data.
- They are **time-poor, not tech-poor.** Overwhelm comes from too many things asking for attention at once, not from complexity alone.
- Bilingual: English UI with a Bangla toggle (Noto Sans Bengali). Copy must survive translation and stay short in both languages.

## Product principles (check every screen against these)
1. **Margin does the work, the teacher approves.** Every AI output is an approval card with Approve / Edit / Dismiss (`sCard()` in `index.html`). Decisions are counted for the IQAC "AI quality" view.
2. **One question per screen.** Each screen answers one thing first (Today: "what do I owe today?"; Grow: "when can I apply for promotion?"). Everything else is secondary.
3. **Private by default.** Teachers' notes, promises, inbox and Compass goals are never shown to the university. Show the lock and the privacy line where it matters, and not on every card.
4. **Nothing breaks.** Missed blocks move; there are no streaks to lose and no red guilt counters.
5. **Never write the research.** Margin finds, formats, checks and drafts responses only.
6. **Honest numbers.** Mark sample metrics "Sample data", and show estimates as estimates.

## Overwhelm budget (Margin's cognitive-load rules)
Use these as pass/fail checks in critiques. Count them on a real 390px screenshot.

| Check | Budget |
|---|---|
| Primary (filled dark) buttons visible in one phone viewport | **1**, at most 2 |
| Distinct cards or sections before the first scroll on a phone | **≤ 3** |
| Competing "hero" elements on one screen | **1** |
| Approval cards shown at once | **≤ 3**; the rest go behind "See all (n)" |
| Pills, tags and badges per card | **≤ 2** |
| Tabs or segmented controls on one screen | **1 row** |
| Repeated privacy notices per screen | **1** |
| Body copy per card before "more" | **2 lines** |
| Numbers in a single stat row | **≤ 3** |
| Taps from opening the app to the day's first action | **≤ 2** |

When a screen breaks the budget, recommend **what to hide, merge or defer**, not just "simplify". Progressive disclosure is the default: summary first, detail on tap.

## Design tokens (from `index.html` :root and the v9 layer)
- **Surfaces:** `--page` `--frame` (cards) `--surface` (sections) `--sunk` `--line` `--line-2`
- **Ink:** `--ink` `--ink-2` `--ink-3` (lowest; check contrast)
- **Actions:** `--primary` (dark, filled buttons) `--accent` / `--p-yellow` (highlight) and the pastels `--p-blue` `--p-lav` `--p-pink` `--p-orange`, with `--on-pastel` text
- **Status:** `--ok`/`--ok-soft`, `--warn`/`--warn-soft`, `--cool`/`--cool-soft` (privacy)
- **Shape:** cards 22 to 28px radius, pills 99px, `.btn.sm` min-height 36px (below the 44px touch target, so flag it on phone)
- **Type:** sans 800 for headings (`.hello`, `.b-h h2` 18px), body 15 to 15.5px, meta 12 to 13px
- **Components:** `.b` section, `.scard` approval card, `.r9` row, `.tg` tag, `.pill`, `.impill`, `.segs`, `.modeseg`, `.ring`, `.meter`, `.g9h` dark hero, `.tabs.fl` floating phone nav, `.sheet` side sheet, toasts with a trail and Undo
- Dark mode is supported via `[data-theme]` and `prefers-color-scheme`, so check both.

## Domain words (keep them consistent)
CLO / PLO (course and programme learning outcomes) · CLO attainment · Course file (BAC accreditation evidence) · IQAC (quality assurance cell) · Trimester (14 weeks, **not** "semester" in new copy) · Promotion rule / dossier · Indexed (Scopus / WoS), Q1 to Q4 · Moderation (question-paper review)

## Where findings go
Use **GitHub issues** in `itshimadry789/Margin_MVP`: one issue per finding, titled `[UX] <screen>: <problem>`, with labels `ux`, `a11y` or `copy`, and a severity of `sev:critical`, `sev:moderate` or `sev:minor`. Include the screenshot width and the overwhelm-budget line it breaks.

## Feedback and research
There is no feedback tool or analytics yet. The evidence is the UIU BBA pilot teachers. Treat claims about teacher behaviour as hypotheses, and suggest a 5-teacher hallway test to confirm them.
