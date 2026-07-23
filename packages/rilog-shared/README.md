# @rilog-development/rilog-shared

Types and generic utilities shared between `@rilog-development/rilog-lib` and `rilog-chrome-extension`. **Types are the key shared artifact** — the two consumers may (and likely will) capture events through entirely different mechanics; what keeps them interoperable is producing data in the same shapes.

## What lives here

- **Types**: `ERilogEvent`, `IRilogEventItem`, `IRilogRequestItem`, `IRilogRequest`/`IRilogResponse`, `IRilogRequestTimed`/`IRilogResponseTimed`, `IRilogLocation`, and the capture-config shape (`TRilogCaptureConfig`, `ISelfServer`, `TExternalInfoMeta`, `TDeviceInfo`).
- **Generic utilities** with no dependency on how events were captured: `utils/id.ts` (`generateUniqueId` — consistent id format), `utils/browser.ts` (`getExternalInfo`/`getLocation`/`getDeviceInfo`), `utils/transforms.ts` (`parseStackTrace`/`getQueryParamsFromUrl`), `utils/logger.ts` (`@logMethods` dev decorator).

## What does NOT live here

The actual interceptor implementations (`feature/interceptors/*` — fetch/XHR/axios/click/console/input/message), `core/filterRequest.ts` (`RilogFilterRequest`, sensitive-data masking against `ignoredRequests`/`sensetiveRequsts`), and `utils/filters.ts` all live in `rilog-lib` itself — they're specific to how `rilog-lib` captures events and configures masking. `rilog-chrome-extension` is expected to implement its own capture (different execution context, likely a `MAIN`-world content script and/or its own rule engine) rather than reuse these — it only needs to emit data shaped as the types above.

## Consumers

- `@rilog-development/rilog-lib` — depends on this package for the event/request type contract and generic utilities; owns its own capture logic and transport/batching (`core/interceptor.ts`, `core/timer.ts`, `api/*`, `core/Rilog.ts`, `feature/interceptors/*`, `core/filterRequest.ts`).
- `rilog-chrome-extension` — will depend on this package's types (mandatory) and may reuse the generic utilities; its own capture mechanics are independent.

## Conventions

- Intentional typos (`sensetive`, `libruaryRequest`, `queque`) are preserved from `rilog-lib` — do not rename them.
- No build step yet: consumed as TypeScript source directly via npm workspaces (`main`/`types` point at `src/index.ts`). `rilog-lib`'s `tsup` build bundles this package's compiled output into its own `dist/` output (`noExternal` in `tsup.config.ts`), so published `rilog-lib` stays self-contained at runtime. The `.d.ts` output still references `@rilog-development/rilog-shared` directly rather than inlining it — see the note in `packages/rilog-lib/CLAUDE.md`.
