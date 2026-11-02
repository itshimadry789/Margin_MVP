# Product
<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Teachers at private universities in Bangladesh, from Lecturer to Associate Professor. Each carries 3 to 4 courses, 100 to 200 students, committee work, thesis supervision and the research that decides promotion. They open Margin in short gaps, before 9 am, on the bus or between classes, mostly on a mid-range Android phone over mobile data. A session lasts 30 seconds to 3 minutes; long work (grading, writing) happens on a laptop. They are time-poor, not tech-poor. Secondary audiences: the department chair (operational counts, sign-off) and IQAC and the VC (department-level CLO and course-file status). Neither ever sees a teacher's private items.

## Product Purpose
Margin answers three questions. Each morning: "What do I owe today, and to whom?" Each trimester: "Is my course file and CLO evidence in, without a scramble?" Each year: "Am I moving toward promotion?" Success means minutes given back to teachers, not time spent in the app.

## Positioning
Margin does the work and the teacher approves. Every AI output is a draft the teacher approves, edits or dismisses (an approval card), and nothing is sent, filed or shared without that tap. It is private by default: the university sees operational counts only, and no teacher is ranked.

## Operating Context
- **Sections:** Today (what you owe: promises, messages, drafts, the day's schedule, protected writing time), Make (question papers, course files, recommendation letters, replies), Grow / Compass (promotion gap, research pipeline, journal finder, formatter, reviewer responses, Friday review), People (promises, students, colleagues).
- **Calendar and accreditation:** a 14-week trimester. Course files serve BAC accreditation, and CLO and PLO attainment feeds IQAC.
- **Data:** arrives as portal Excel exports and uploads, with no live portal integration.
- **Language:** English interface with a Bangla toggle (beta: menus and dates).

## Capabilities and Constraints
- The prototype is a static web app: `index.html` and `lib/`. The AI and department API sit behind `/api/*`, with offline fallback drafts.
- 390px phones come first; desktop at 1366px is second.
- Domain words: CLO, PLO, course file, IQAC, BAC, trimester (never "semester" in new copy), promotion rule, indexed (Scopus/WoS, Q1 to Q4).
- **Undecided:** whether the section is named "Grow" or "Compass"; full Bangla translation.

## Brand Commitments
- Name: Margin. Tagline: "Teach better. Grow faster."
- Voice: calm, plain, second person, no guilt or urgency words.
- One privacy line per screen: "Private: your university never sees this."

## Evidence on Hand
Prototype data only: sample personas, sample research metrics (labelled "Sample data") and fictional journals. There are no real customer quotes, metrics or testimonials; future work must not invent any. The first pilot is planned with UIU BBA.

## Product Principles
- Margin does the work; the teacher approves. Every AI output can be approved, edited or dismissed, and every action can be undone.
- One question per screen, answered first; everything else is secondary.
- Private by default, utility over engagement: no streaks, guilt counters or re-engagement nudges.
- Honest numbers: estimates are labelled as estimates, and sample data as sample data.
- Never write the teacher's research; find, format, check and draft responses only.

## Accessibility & Inclusion
WCAG 2.2 AA. 44px touch targets on phones. Text contrast of 4.5:1 or better in light and dark. English and Bangla (Noto Sans Bengali, Bengali numerals in Bangla mode).
