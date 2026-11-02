# Critique: Margin teacher app (index.html, lib/compass.*), 2026-11-02

Method: dual-agent (A: design review · B: browser evidence). The deterministic detector did not run: the engine binary was blocked by the session's security policy. B gathered equivalent evidence with Playwright.
Target: index.html (Today, Make, Grow, People) at 390×844 and 1366×900, light and dark. Mode: Operate.

## Design Health Score (before fixes)
| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3 |
| 2 | Match system / real world | 3 |
| 3 | User control and freedom | 3 |
| 4 | Consistency and standards | 2 |
| 5 | Error prevention | 3 |
| 6 | Recognition over recall | 3 |
| 7 | Flexibility and efficiency | 2 |
| 8 | Aesthetic and minimalist design | 1 |
| 9 | Error recovery | 3 |
| 10 | Help and documentation | 3 |
| **Total** | | **26/40 (Acceptable)** |

## Design specificity verdict
Mostly category-interchangeable. The copy is product-specific, but the visuals follow a generic pastel-bento productivity template: decorative 3D donuts, five pastels used without meaning, an eyebrow label, an icon tile above every heading, cards nested in cards, decorative rings, pills for everything, and a glow.

## Evidence (B)
- Today, first phone viewport: 16 distinct background colours (23 at 1366).
- 11 to 18 font sizes per screen, including half-pixel steps; 10.5px minimum; weights 400 to 900.
- 293 hard-coded colours outside tokens.
- Grow: cards nested 3 deep; 3.4 screens long on a phone.
- Contrast failures: 4, on Grow pipeline cards (opacity .85).
- Text under 24px: "Priya Das" link fails the spacing exception.
- Type is all px, so user font-size preferences are ignored.
- 8 transitions on layout properties.

## Priority issues and status
- [P1] Colour carries no meaning. **Fixed** in lib/calm.css: neutral surfaces; one tint for the "now" card; warn for late only.
- [P1] The Today hero is spent on decoration, and phone Today has two heroes. **Fixed**: donuts and vase removed, notification card reduced to one line, the "9 things" tag moved off the hero.
- [P1] Grow is a long dashboard. **Fixed**: eyebrow removed (ban); action cards are one-line rows on phones that open the full card in a sheet; pipeline lanes flattened; glow removed. 3.4 → 2.4 screens, 298 → 181 words.
- [P2] No type scale. **Partly fixed**: small text snapped to 12px, section and title weights 800 → 700. Still open: a real 5-step scale in rem.
- [P2] Box-in-a-box lists. **Fixed on phones**: list sections are rows on the page.
- Also fixed:
  - Desktop research card quieted (no second black hero).
  - The welcome toast that covered the list was removed.
  - "Late" tag contrast raised to 4.5:1.
  - Pipeline-card contrast fixed.
  - The Grow privacy pill no longer clips at 320px.

## Still open
- Type in px (no rem), so user font-size preferences are ignored. Needs a type-scale refactor (`/impeccable typeset`).
- 293 hard-coded colours (`/impeccable extract`).
- Desktop Today keeps both the 0/9 meter and the Calm/Full switch.
- "Mark all graded" has Undo but no confirmation.
- "Grow" vs "Compass" naming.
