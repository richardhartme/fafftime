# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the TypeScript application code. 
Core analysis lives in `src/core/`, UI helpers in `src/ui/`, utilities in `src/utils/`, and shared types in `src/types/`.
`tests/` holds Vitest suites that exercise the exported API via `src/main.ts`.
Build artifacts are emitted into `dist/`; coverage reports land in `coverage/`. Treat both as disposable and avoid hand-editing generated output.

## Build, Test, and Development Commands
`npm start` launches the webpack dev server with live reload.
`npm run dev` watches and rebuilds bundles without serving, useful for quick TypeScript feedback.
`npm run build` creates a production bundle in `dist/`.
`npm test`, `npm run test:watch`, and `npm run test:coverage` run the Vitest suite in standard, watch, and coverage modes.
Deploy helpers call `./deploy.sh`: use `npm run deploy:staging` during verification and `npm run deploy:production` for releases.

## Coding Style & Naming Conventions
TypeScript throughout; keep files as `.ts` and prefer named exports from modules.
Follow the existing two-space indentation and trailing comma defaults shown in `src/main.ts`.
Use `camelCase` for functions and variables, `PascalCase` for React-style components or class-like constructs, and kebab-case for filenames unless a framework dictates otherwise.
No auto-linter is configured, so rely on TypeScript’s compiler and Vitest to catch regressions before committing.

## Testing Guidelines
Component tests rely on React Testing Library; favor user-centric queries (`screen.getByRole`) and avoid implementation details.
Place new tests beside the component under test and keep descriptive test names (`renders ride summary`).
Run `npm test -- --watch=false` before opening a PR to ensure a clean pass.
Snapshot tests should be refreshed only when UI changes are intentional.

## Commit & Pull Request Guidelines
Commit messages in this repo follow short, imperative lines (`Remove merge helpers`, `Add faff threshold breakdown`). Mirror that style and keep scope focused.
Pull requests should include: a summary of changes, testing notes (commands run), linked issues if applicable, and UI screenshots whenever DOM or styling changes occur.
Flag any breaking analysis changes and mention related configuration updates such as timestamp thresholds or deploy script tweaks.
