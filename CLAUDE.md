# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Monorepo (npm workspaces) for the Rilog client-side ecosystem — the frontend monitoring library and the tooling built around it.

```
packages/
├── rilog-lib/              # @rilog-development/rilog-lib — the published npm library. See packages/rilog-lib/CLAUDE.md.
├── rilog-shared/            # @rilog-development/rilog-shared — placeholder. Will hold interceptor logic + types shared
│                             # between rilog-lib and the Chrome extension (not yet extracted).
└── rilog-chrome-extension/  # rilog-chrome-extension — placeholder. Manifest V3 DevTools extension (not yet scaffolded).
```

Each package has its own `CLAUDE.md` with package-specific commands and architecture once it has real content — start there for anything below `packages/<name>/`. This root file only covers cross-package/repo-wide concerns.

## Commands

```bash
npm install                                              # installs all workspaces from the root
npm run build --workspace=@rilog-development/rilog-lib   # or: cd packages/rilog-lib && npm run build
npm test --workspace=@rilog-development/rilog-lib
```

`rilog-lib` keeps its own local dev scripts (`yarn build`/`yarn test`/`yarn patch`/`yarn release`, see `packages/rilog-lib/CLAUDE.md`) — those are run from inside `packages/rilog-lib` directly and are unaffected by the workspace root, except that `node_modules` are hoisted to the repo root by npm workspaces.

## Repo-wide conventions

- **Intentional typos** in identifiers (`sensetive`, `libruaryRequest`, `queque`) originate in `rilog-lib` and should be preserved wherever that code is reused (e.g. once extracted into `rilog-shared`) — do not rename them.
- CI (`.github/workflows/ci.yml`, `.github/workflows/release-package.yml`) installs from the repo root and scopes build/test/publish to the `@rilog-development/rilog-lib` workspace. Update these when a package gains its own CI needs (e.g. the extension's own build/package step).
- `rilog-lib` is the only package currently published (to npm). `rilog-shared` and `rilog-chrome-extension` are unpublished scaffolds — do not add real publish steps for them until they have real content.

## History

This repo was `rilog-lib` as a standalone package until it was restructured into this monorepo (on branch `feature/rilog-chrome-extension`) to support building a Chrome DevTools extension that reuses `rilog-lib`'s capture logic. The GitHub remote is still named `rilog-lib` — renaming it is a separate, manual step outside of git.

---

## Commit message rule

**After every task, always output a suggested git commit message** in [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<optional scope>): <short imperative description>
```

Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `build`.
Keep the subject line under 72 characters. No period at the end.

Example:
```
feat(interceptor): add per-request timeout with auto-eviction
```
