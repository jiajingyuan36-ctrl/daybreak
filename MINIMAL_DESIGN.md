# Minimal Greek inscription revision

Supersedes the earlier EPIC_DESIGN visual specification.

- Cinzel headings, Cormorant Garamond Latin body and Noto Serif SC Chinese, self-hosted by Next font output; existing OFL notices retained.
- Monochrome basalt/plaster themes, shared navigation, narrow central layout, text controls, no glass, glow, gold or rounded cards.
- Calendar: date picker, computed moon phase, daily word and two actions. Saved birth preferences are read without changing existing storage.
- Daily tarot: card and orientation, one action, single-line review; history and export remain. Review updates preserve existing review metadata.
- Consult: question, six text spread choices, deck, reading and history. Encyclopedia retains complete sourced meanings.
- First-run preferences and visible resonance scores removed. Storage schema and keys unchanged.
- Sharing waits for fonts; canvas card and moon render with monochrome colors.

Validation: Next production build and 26 logic tests passed. npm run lint performs TypeScript diagnostics (the historical lint.mjs entry was missing); no ESLint ruleset is configured. Local browser preview was blocked by environment policy; live browser verification follows deployment.
