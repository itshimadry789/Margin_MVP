# Margin teacher app (prototype v13.1): Today, Make, Grow and People, on a 390px phone and a 1366px desktop

## Anti-Pattern Verdict
**Significant Issues.**
- **AI training use without the teacher's consent. Severity: High.** Every Approve, Edit and Dismiss on an AI card is counted and, per the IQAC view, "become[s] training data for Margin's own models". No teacher-facing screen says so, and no control turns it off. The teacher who generates the data never sees the disclosure; only IQAC does.
- **Shame-adjacent urgency. Severity: Medium.** The Today hero says "It's 1 day late and Mehnaz is waiting." The fact is useful; the waiting person used as pressure is not.
- **Guilt counters on research. Severity: Medium.** Grow marks papers with "21 days since it last moved" in red and an orange "2 stalled" tag. This contradicts the product's own promise that missed research time "never breaks".
- **Deficit-framed progress meter. Severity: Low.** Desktop Today opens each morning at "0/9 cleared", a score the teacher starts every day losing.

## Priority Issues

### Major

**Drafted replies are signed with another teacher's name.** The draft reply to Priya Das ends "Best, Dr. Rahman", while the signed-in teacher is Dr. Kabir. "Approve & copy" puts that signature on the clipboard, ready to paste into an email to a student. A teacher skimming a 3-line draft between classes will not catch it. Violates error prevention, and consistency and standards. Fill the signature from the teacher's profile at draft time, and never store a name inside draft text.

**Training use of teachers' decisions is not disclosed to them.** Covered under the anti-pattern verdict. Violates user control and freedom. Tell the teacher on their privacy screen that only the counts are collected, never the text. Make sharing them an opt-in switch, off by default, and stop counting while it is off.

**Bangla mode is mostly English.** With Bangla on, 6 of 103 words on Today are Bangla, 1 of 287 on Grow, 3 of 173 on Make and 12 of 115 on People. Sentences mix scripts mid-clause: "It's ১ দিন দেরি and Mehnaz is waiting." A teacher who switches to Bangla gets nav labels and dates only, and reads hybrid sentences that are harder than either language. Violates match between system and real world. Translate whole sentences from templates with native review. Until then, label the switch "বাংলা (beta)" and never splice a Bangla fragment into an English sentence.

**Grow has two rows of navigation on phones.** The app's tab bar plus Compass's six sub-tabs (Home, Journals, Format, Reviews, Ideas, Friday). The sub-tab row scrolls sideways at 390px, so Reviews, Ideas and Friday are off-screen. Over the overwhelm budget on tab rows; violates aesthetic and minimalist design. On phones, drop the sub-tab row. Compass home is the hub, each tool opens from its card or from a short tools list, and each tool screen has a "Back to Compass" link.

**Desktop Today has three hero-weight blocks above the fold.** The "2 drafts are ready" strip, the purple "Return chapter 2 feedback" card and the dark research card compete, beside a 0/9 meter and a Calm/Full switch. The eye has no single starting point on the screen meant to answer "what do I owe today?". Violates aesthetic and minimalist design. Put the two drafts at the top of the "After that" list, and keep either the meter or the Calm/Full switch.

### Minor

**"Is waiting" and "stalled" copy pressures instead of informing.** Covered under the anti-pattern verdict. Violates aesthetic and minimalist design in tone. State the fact and who it is for ("1 day late · for Mehnaz"). On research, say "Last moved 3 weeks ago" and "Needs a next step", in neutral colour.

**Two counts for one list on Today.** The header says "8 more · tap one to open it" and the button says "Show 5 more". Both are right (3 shown plus 5 hidden), but the reader has to do the sum. Violates recognition rather than recall. Header "3 of 8 shown"; button "Show all 8".

**"Given back" hours are not marked as estimates.** "4.2 h given back" on Today has no qualifier, though each figure is an estimate per approved item and the toasts say "(estimate)". Violates the product's honest-numbers stance and match between system and real world. Add "est." next to the figure.

**Course file opens on grading, not on what the file needs.** Tapping "Course file · CSE 201: 2 need you" opens a sheet that starts with grading pace and bulk-grading buttons. The two items that need the teacher sit below the fold. Violates match between system and real world. When the sheet is opened from the course-file tile, scroll to "Needs you", or put it first.

**Phone tab bar icons are unlabelled, and the Grow icon means AI everywhere else.** Only the current tab shows its label. Grow's sparkle is the same icon as "Why this?" and AI drafts across the app, so "Grow" reads as "AI". Violates recognition rather than recall. Give Grow its own icon (the compass), and show short labels under all four icons.

**Small tap targets outside Grow.** The shared small button is 36px tall. People has 13 controls under 44 × 44px on a phone. Violates the touch-target minimum (WCAG 2.5.5). Raise small buttons and link pills to 44px on phones.

**Meta text sits just under 4.5:1 contrast.** Secondary lines such as "Nusrat Jahan" under a promise (12.5px) and the "Sample data" tag (10.5px) measure 4.42:1. Violates the 4.5:1 contrast minimum for small text (WCAG 1.4.3). Darken the tertiary ink token one step in light mode.

**One section, two names.** The nav says "Grow" and the page says "Compass". The More menu says "Semester map" where the rest of the app says trimester. Violates consistency and standards. Use "Trimester map" now; the Grow or Compass choice is an open question.

### Cosmetic

**Escape does not leave the Compass demo.** Every sheet and the guided tour close with Escape; the demo bar does not. Violates user control and freedom. Close the demo on Escape.

## Heuristic Verdicts
- Visibility of system status: holds.
- Match between system and real world: broken. Bangla mode is mostly English.
- User control and freedom: broken. Training use of teachers' decisions is not disclosed to them.
- Consistency and standards: broken. Drafted replies are signed with another teacher's name.
- Error prevention: broken. Drafted replies are signed with another teacher's name.
- Recognition rather than recall: strained. Phone tab bar icons are unlabelled, and the Grow icon means AI everywhere else.
- Flexibility and efficiency of use: holds.
- Aesthetic and minimalist design: broken. Grow has two rows of navigation on phones.
- Help users recognize, diagnose, and recover from errors: holds.
- Help and documentation: holds.

## Cognitive Walkthrough Results

| Task (phone) | Step | Motivation | Visibility | Understanding | Feedback | Rating | Finding |
|---|---|---|---|---|---|---|---|
| Approve an AI draft reply | Open the drafts from the 8:00 am banner | Yes | No | Yes | Yes | Hesitation | Desktop Today has three hero-weight blocks above the fold |
| Approve an AI draft reply | Approve & copy | Yes | Yes | No | Yes | Hesitation | Drafted replies are signed with another teacher's name |
| Find the promotion date and next step | Pick the right tab | Yes | Yes | No | Yes | Hesitation | Phone tab bar icons are unlabelled, and the Grow icon means AI everywhere else |
| Finish a course-file item | Reach the item that needs you | Yes | No | Yes | Yes | Hesitation | Course file opens on grading, not on what the file needs |
| Open Reviews, Ideas or Friday in Grow | Find the tool | Yes | No | No | Yes | Failure | Grow has two rows of navigation on phones |

## Positive Findings
- The approval card is the same everywhere: Approve, Edit, Dismiss, a "Why this?" reason and a privacy line, so one pattern covers every AI output.
- Every completed action ends in a toast that says what changed and offers Undo ("Promise kept: Return chapter 2 feedback · Logged on Mehnaz's student card · Undo").
- The morning's first action is one tap on the phone: the hero's Done button is 427px from the top.
- Privacy statements are specific rather than vague: "your chair sees this number, nothing else".
- Every button has an accessible name, every focus stop shows a focus ring, and Escape closes every sheet.
- No screen scrolls sideways at 390px, in English or in Bangla.
- Grow, Today and focus mode now show one set of research hours and one promotion date.

## Recommended Actions
- Drafted replies are signed with another teacher's name
- Training use of teachers' decisions is not disclosed to them
- Grow has two rows of navigation on phones
- "Is waiting" and "stalled" copy pressures instead of informing
- Bangla mode is mostly English
- Desktop Today has three hero-weight blocks above the fold
- Two counts for one list on Today
- "Given back" hours are not marked as estimates
- Small tap targets outside Grow
- Meta text sits just under 4.5:1 contrast
- Course file opens on grading, not on what the file needs
- Phone tab bar icons are unlabelled, and the Grow icon means AI everywhere else
- One section, two names
- Escape does not leave the Compass demo
