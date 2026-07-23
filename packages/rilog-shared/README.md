# @rilog-development/rilog-shared

Placeholder package. Will hold the interceptor logic (`fetchInterceptor`, `xhr`, `axios`, `click`, `console`, `input`, `message`), sensitive-data filtering (`filters.ts`), and shared types (`ERilogEvent`, `IRilogEventItem`, etc.) currently living in `packages/rilog-lib/src`.

Consumers (planned):
- `@rilog-development/rilog-lib` — the site-facing library, will depend on this for capture logic and keep only batching/localStorage/transport concerns.
- `rilog-chrome-extension` — will use this package to run the same capture logic standalone inside a page's `MAIN` world, independent of whether the page has `rilog-lib` installed.

Not yet extracted — this is a scaffold for the upcoming refactor.
