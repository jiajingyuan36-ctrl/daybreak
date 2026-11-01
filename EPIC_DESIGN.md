# Delphic visual revision

Updates the existing six routes; LocalStorage keys, record schema, deck selection and orientation probabilities remain unchanged.

Files: app/layout.tsx; legacy-static/epic.css; src/components/oracle-ornaments.tsx; src/components/almanac-dashboard.tsx; src/components/tarot/tarot-workbench.tsx; src/components/legacy-screen.tsx; src/art.ts; src/app.ts; src/share.ts; prepare-legacy.mjs; public/licenses/*.

Cinzel / Cinzel Decorative for Latin inscriptions, Noto Serif SC for Chinese display, Cormorant Garamond + Noto Serif SC for prose. Functional controls retain locally hosted Source Han Sans. Google fonts are fetched at build time by next/font and served from the site's own static assets; visitors do not need to access Google Fonts. OFL notices in public/licenses are downloaded from the official google/fonts repository.

Moon illumination continues to use Astronomy Engine; orbit rings, constellation-like lines, laurel patterns and Greek inscriptions are explicitly decorative. No real constellation placement or new predictive data is claimed. All non-essential animation respects prefers-reduced-motion. Ritual shuffle delay is 800 ms; random draws and history are unchanged.

Calendar PNG export supports obsidian and marble with the calculated moon at the selected date. Tarot export retains classic/space/night layout IDs for backward compatibility; classic is marble, night is obsidian. Uses arch, double rules, meander and calculated local-noon moon geometry. Font loads are awaited before export. History/settings use an SSR skeleton before the legacy client script replaces it with real local data.
