# Playwright Framework Foundation — Design

## Purpose

Portfolio project demonstrating Playwright test automation skills against
[nopCommerce demo store](https://demo.nopcommerce.com/). Goals: solid test
automation fundamentals, framework/architecture quality, eventual broad
coverage of the app, and breadth across Playwright's tooling (TypeScript,
possibly API testing later).

This spec covers the **initial framework foundation** and a single first
test (homepage loads). Test suite scope beyond that will be built
incrementally, test by test, in future work — not planned exhaustively
up front.

## Context

- Author is comfortable with Playwright already; framework should follow
  professional conventions without extra hand-holding.
- Project directory is currently empty (no git repo, no code).

## Tooling & Config

- **Test runner**: `@playwright/test`
- **Language**: TypeScript
- **Base URL**: `https://demo.nopcommerce.com/` set in `playwright.config.ts`
  so tests/page objects use relative paths (`/`, `/search`, etc.)
- **Browsers**: Chromium, Firefox, and WebKit configured as projects
  (cross-browser coverage from the start)
- **Reporter**: Playwright's built-in HTML reporter (default), viewable
  locally via `npx playwright show-report`

## Project Structure

```
my-playwright-project/
├── tests/
│   └── home.spec.ts
├── pages/
│   └── HomePage.ts
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── .gitignore
```

- `pages/` — Page Object Model classes, one per page. Encapsulates
  locators and actions so specs stay readable and resilient to markup
  changes.
- `tests/` — spec files that consume page objects.
- `fixtures/` is intentionally **not** scaffolded yet — it will be added
  once there's a real shared fixture to justify it (e.g. authenticated
  session state for account/checkout tests). Avoids empty/premature
  structure.

## First Test

- `HomePage` page object:
  - `goto()` — navigates to `/`
  - A locator/assertion target that proves the page loaded correctly
    (e.g. distinctive header/logo element or page title)
- `tests/home.spec.ts`:
  - One test: "homepage loads successfully" — navigates via `HomePage`
    and asserts the key element is visible.

## Out of Scope (for this spec)

- Full test suite coverage (search/catalog, cart/checkout, account/auth,
  API tests) — each will be scoped and built incrementally in future
  work, one at a time.
- CI integration — not addressed yet, can be added once there's a
  meaningful suite to run.
- Fixtures for shared setup (e.g. auth state) — deferred until needed.

## Git

- No git repository exists yet. Initialize one and commit the initial
  scaffold once the first test passes, since this is a portfolio project
  intended to be pushed to GitHub.
