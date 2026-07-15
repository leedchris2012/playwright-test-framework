# Sauce Demo Playwright Test Suite

[![Playwright Tests](https://github.com/leedchris2012/playwright-test-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/leedchris2012/playwright-test-framework/actions/workflows/playwright.yml)

An end-to-end test suite built with [Playwright](https://playwright.dev/) against [saucedemo.com](https://www.saucedemo.com), a sandbox e-commerce site that ships with intentional bugs tied to specific test user accounts. This project is a portfolio piece demonstrating test design, page object structure, and bug-catching (functional + visual regression) testing.

## Setup

```bash
npm install
npx playwright install
```

## Running Tests

Run the full suite (chromium, firefox, webkit):
```bash
npx playwright test
```

Run only on Chromium (required for snapshot tests — firefox/webkit skip `tests/snapshot/**`):
```bash
npx playwright test --project=chromium
```

Run only functional tests (excludes `tests/snapshot`):
```bash
npx playwright test tests/cart tests/filter tests/inventory tests/login
# or:
npm run test:functional
```

Run only snapshot tests (chromium only):
```bash
npx playwright test tests/snapshot --project=chromium
# or:
npm run test:snapshot
```

Run a specific file:
```bash
npx playwright test tests/snapshot/cart/checkout-complete-visual.spec.ts
```

Run tests matching a name:
```bash
npx playwright test -g "checkout complete"
```

Update snapshot baselines after an intentional UI change:
```bash
npx playwright test --update-snapshots
```

View the HTML report from the last run:
```bash
npx playwright show-report
```

Debug interactively:
```bash
npx playwright test --headed
npx playwright test --debug
```

## Project Structure

```
pages/      Page object models (LoginPage, InventoryPage, CartPage, CheckoutStepOnePage, CheckoutStepTwoPage, CheckoutCompletePage, ProductDetailsPage)
tests/setup/  Auth setup project — logs in once per test account, saves session state to .auth/ for reuse
tests/      Functional tests, organized by feature (login, inventory, cart, filter)
tests/snapshot/   Visual regression tests (Chromium only), organized to mirror tests/
```

## Authentication

Most tests don't need to exercise the login form — they reuse a saved session instead. A dedicated `setup` project (`tests/setup/auth.setup.ts`) logs in once per account (`standard_user`, `problem_user`, `visual_user`, `error_user`) before the main test projects run, saving each session to `.auth/<account>.json` (gitignored, regenerated every run). Spec files opt in with `test.use({ storageState: '.auth/<account>.json' })`, either at the top of the file for single-account specs or inside a `test.describe` block when a file covers more than one account.

Two cases always drive the real login form instead: `tests/login/login.spec.ts` (login behavior is the thing under test) and the `locked_out_user` account (it never reaches an authenticated session, so no storage state exists for it).

## Bugs Documented

Sauce Demo ships several test accounts that each trigger a different class of bug. This suite exercises and documents:

- **`error_user`** — cannot add all products to cart (only 3 of 6 succeed); checkout form silently rejects input in the last-name field
- **`visual_user`** — misplaced cart icon and incorrect/randomized prices on the inventory page
- **`problem_user`** — broken product images; product detail navigation issue
- **`performance_glitch_user`** — login flow is ~50-60x slower than a normal user
- **`locked_out_user`** — login is blocked with an error message; covered by a snapshot test of the login error state

Each bug is covered by a functional assertion test, and select cases (login errors, cart/checkout states, broken images) also have a visual regression snapshot.

## Notes

- Base URL and browser projects are configured in `playwright.config.ts`.
- Snapshot tests currently run on Chromium/macOS only; baselines are platform-specific.
