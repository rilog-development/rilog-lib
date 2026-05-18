# Contributing to rilog-lib

Thank you for taking the time to contribute. All contributions are welcome — bug reports, feature requests, documentation improvements, and code changes.

## Getting started

```bash
git clone https://github.com/rilog-development/rilog-lib.git
cd rilog-lib
npm install
```

`npm install` will build the library and set up git hooks automatically via husky.

## Development workflow

```bash
npm run build    # compile TypeScript → dist/
npm test         # run all tests
npm run lint     # check code style
npm run format   # auto-format with prettier
```

Tests run automatically before every `git push` (husky pre-push hook). Fix any failing tests before pushing.

## Submitting changes

1. Fork the repository and create a branch from `main`.
2. Make your changes. Add or update tests for any new logic.
3. Ensure `npm test` and `npm run lint` pass locally.
4. Open a pull request against `main`. Fill in the PR template.

## Commit message format

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short description>
```

Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `build`.  
Keep the subject line under 72 characters. No trailing period.

Examples:
```
feat(interceptor): add per-request timeout with auto-eviction
fix(xhr): handle missing responseText on network error
docs(readme): add Vue 3 integration example
```

## Environment variables

Copy `.env.example` to `.env` before building. The build works fine with the default values — no Rilog cloud account is required for local development.

```bash
cp .env.example .env
```

## Code style

- TypeScript strict mode, target ES5.
- Prettier config: `printWidth: 200`, `tabWidth: 4`, single quotes, trailing commas.
- Interfaces prefixed `I`, types prefixed `T`, enums prefixed `E`.
- Intentional typos in the codebase (`sensetive`, `libruaryRequest`, `queque`) — do not rename them; they appear across types, constants, and method names.

## Reporting bugs

Open an issue using the **Bug report** template. Include steps to reproduce, expected behavior, and actual behavior.

## Questions

Open a [GitHub Discussion](https://github.com/rilog-development/rilog-lib/discussions) for questions about usage or integration. Use issues for bugs and feature requests only.
