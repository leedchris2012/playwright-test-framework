# Sauce Demo Playwright Test Suite

[![Playwright Tests](https://github.com/leedchris2012/playwright-test-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/leedchris2012/playwright-test-framework/actions/workflows/playwright.yml)

An end-to-end test suite built with [Playwright](https://playwright.dev/) against [saucedemo.com](https://www.saucedemo.com), a sandbox e-commerce site that ships with intentional bugs tied to specific test user accounts. This project is a portfolio piece demonstrating test design, page object structure, and bug-catching (functional, visual regression, accessibility, and network resilience) testing.

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

Run only accessibility tests:
```bash
npx playwright test tests/accessibility
# or:
npm run test:a11y
```

Run only network mocking / resilience tests:
```bash
npx playwright test tests/network
# or:
npm run test:network
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
tests/accessibility/   Automated a11y scans (axe-core), one spec per key page
tests/network/   page.route() network resilience tests (third-party telemetry, broken/slow assets)
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

## Accessibility Testing

`tests/accessibility/` runs [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright) scans, tagged to the WCAG 2.0 A/AA rule set, against seven key pages under `standard_user`: login (unauthenticated), inventory, product details, cart, and all three checkout steps. Cart and checkout pages are scanned in their realistic, populated state (item actually in the cart) by walking the same add-to-cart → checkout flow the functional suite uses, not by jumping directly to a URL.

One real, reproducible defect was found this way and documented in [BUG-009](docs/bug-reports/BUG-009-inventory-sort-dropdown-no-accessible-name.md): the inventory page's sort `<select>` had no accessible name, a critical-impact WCAG 2.0 A violation on Chromium/Firefox/WebKit alike. The test was pinned with `test.fail()`, the same pattern used elsewhere in this suite to document a known bug without turning CI red. When Sauce Labs fixed it (verified 2026-10-15), the mark flipped the test to a failure and flagged the change; the scan now guards against regression.

**Known gap**: this is automated scanning only (axe-core's static/DOM-based rule checks), not a manual screen-reader or keyboard-navigation pass, and only `standard_user` is scanned — it doesn't check whether the other test accounts' bugs (e.g. `problem_user`'s broken images) introduce additional accessibility issues like missing alt text.

## Network Mocking

`tests/network/` uses Playwright's `page.route()` to intercept and manipulate real network requests — but the scope here is shaped by what saucedemo.com actually does on the wire, confirmed by logging every request the app makes: there's no product/cart/checkout API to intercept (the catalog is baked into the JS bundle, and login is checked client-side against a hardcoded list), so the classic "mock the API response" pattern doesn't apply. The only real `fetch()` calls anywhere on the site are third-party telemetry beacons to `events.backtrace.io`.

Three specs test resilience instead of mocking data:

- **`telemetry-resilience.spec.ts`**: aborts every `events.backtrace.io` request and confirms the full login → add-to-cart → checkout flow still completes — a realistic "does a third-party dependency outage break core functionality" check.
- **`broken-image-resilience.spec.ts`**: aborts a single product image request and confirms the inventory page stays usable and the item is still addable to cart.
- **`slow-network-resilience.spec.ts`**: delays (rather than fails) a product image response by 3s, and checks two things — the rest of the page (name, price) isn't blocked waiting on that one slow image, and the image itself eventually loads correctly once the delay elapses. Uses `waitForResponse()` so the test genuinely depends on the delay completing, rather than passing regardless of whether the slow request ever resolves.

## CI Architecture

`.github/workflows/playwright.yml` splits the suite across three job types rather than one monolithic run:

- **`test` matrix**: functional + accessibility + network specs, run across a `project × shard` matrix (`chromium`/`firefox`/`webkit` × 2 shards each = 6 parallel jobs). This is also what closed a real gap — CI previously only ran `test:functional` and never ran `tests/accessibility` at all.
- **`snapshot` job**: chromium-only, unsharded — the visual regression suite is small and single-browser, so splitting it further wouldn't buy anything.
- **`merge-reports` job**: downloads every shard's blob report, merges them into one HTML report artifact, and posts a flaky-test count to the workflow's job summary.

**Flake handling**: `playwright.config.ts` sets `retries: process.env.CI ? 2 : 0` — local runs stay deterministic (fail on the first try, no masking), while CI gets two retries so a real transient flake doesn't fail the build outright. Retried-but-eventually-passing tests are tagged `flaky` by Playwright's reporter; the merge job parses the merged JSON report's `stats.flaky` count and writes a warning to the GitHub Actions job summary, so a flaky test is visible without anyone opening the HTML report.

**Known gap**: this surfaces flakiness, it doesn't quarantine it — there's no mechanism yet to tag a chronically-flaky test and run it non-blocking/separately. Not built because there isn't a concretely-known chronically-flaky test to quarantine right now (the webkit flakiness seen during the storage-state migration was intermittent/environmental, not tied to one pinned test); that infrastructure would be the next step if one emerged.

**Snapshot baseline maintenance**: `toHaveScreenshot` baselines are platform-specific by filename (e.g. `-chromium-darwin.png` vs `-chromium-linux.png`), so a baseline captured on a local macOS machine can't satisfy a Linux CI runner and vice versa. This repo commits both: macOS baselines for local dev, and Linux baselines generated by the manually-triggered `.github/workflows/update-snapshots.yml` workflow (`workflow_dispatch`, runs on `ubuntu-latest`, pushes the regenerated PNGs back to the branch). Re-run it whenever an intentional UI change invalidates the baselines.

## Notes

- Base URL and browser projects are configured in `playwright.config.ts`.
