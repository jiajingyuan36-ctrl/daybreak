# Tarot consultation upgrade

Implemented on the existing Next.js project, preserving the daily almanac and daily single-card ritual.

- `src/types/tarot.ts`: card, orientation, spread, position, topic and elemental-summary types.
- `scripts/seed-tarot-data.ts`: converts the existing original Chinese78-card knowledge to complete JSON and generates original geometric SVG assets. Runs before every build.
- `src/data/tarot_cards_78.json`, `src/data/tarot_spreads.json`: stable local data exports. No unverified third-party dataset or image download.
- `src/lib/tarot-catalog.ts`: six spread definitions with explicit positional semantics.
- `src/lib/tarot-engine.ts`: unbiased cryptographic Fisher–Yates shuffle, no repeated cards in one draw; independent50% reversals. Explicit seeds only for reproducible demonstrations/tests, never claimed to predict facts.
- `src/lib/tarot-consultation.ts`: grounded local reading and optional model prompt builder. No external inference request.
- `/consult/`: question, topic, spread choice,78 actual shuffled backs, immediate card explanations, complete local spread reading, element counts, up to30 local records, JSON import/export and PNG export.
- `/encyclopedia/`:78-card search by Chinese/English names and keywords; suit and element classification; accessible native detail dialog; upright/reversed and domain tabs.

Element and major-arcana counts are descriptive statistics of the draw, not evidence about personality, mental health or life events. Major cards use `spirit` as a product classification only. Astrology assignments are explicitly unspecified where not verified. Yes/No stays `maybe`; no deterministic answer to a person's behavior, medical outcome or financial result is manufactured.

This deployment is a static site. No streaming API, paid LLM or follow-up AI chat is falsely presented as connected. Integrating those requires a separate secure server and configured credentials. The prompt builder is prepared, but not a running AI engine. No API key is needed for the implemented features.

The guide's claims of universally accurate dictionaries, unrestricted assets and unthrottled APIs are not adopted as verified facts. Existing source citations are retained; modern Chinese interpretations and geometric images are original. The symbols discussed belong to the RWS tradition; geometric assets are not described as reproductions of those historical pictures.

Validation:26 tests (22 existing +4 tarot tests), TypeScript and Next production build. Question text and local history stay in the browser. Posters include the user's question, which is stated in the export status; no automatic posting is performed.
