# Authentication Storage State — Design

## Problem

Nearly every test in the suite starts by driving the real login form before it can exercise the feature actually under test. This repeats the same login steps across `cart/`, `checkout/`, `filter/`, `inventory/`, and `snapshot/` specs, adding runtime and boilerplate that has nothing to do with what each test is verifying. Playwright supports saving an authenticated browser context ("storage state") to disk and reusing it, which lets tests skip the login UI entirely when login is only a precondition, not the subject of the test.

## Goals

- Eliminate redundant UI logins for tests where authentication is just setup.
- Keep the real login flow intact for tests that specifically verify login behavior.
- Follow current idiomatic Playwright practice (the "setup project" pattern), since this is a portfolio piece meant to demonstrate real-world patterns.
- Migrate existing specs now, not just build unused infrastructure.

## Non-goals

- `locked_out_user` and `performance_glitch_user` are excluded from storage-state generation. `locked_out_user` never reaches an authenticated session — that's the entire point of its test. `performance_glitch_user`'s only test measures login timing itself, so bypassing login defeats its purpose.
- No change to `tests/login/login.spec.ts` — it must keep exercising the real form.

## Architecture

### Setup project

Playwright's dependency-based "setup project" pattern:

- New file `tests/setup/auth.setup.ts`, matching the existing `tests/<feature>/` folder convention.
- Contains one `setup()` test per account: `standard_user`, `problem_user`, `visual_user`, `error_user`. Each logs in through the existing `LoginPage` object and calls `page.context().storageState({ path: '.auth/<account>.json' })`.
- `playwright.config.ts` adds a `setup` project matched via `testMatch: /auth\.setup\.ts/`.
- The `chromium`, `firefox`, and `webkit` projects each add `dependencies: ['setup']`, so the setup project always runs first and generates fresh state files before any dependent test runs.
- `.auth/` is added to `.gitignore` — these are session cookies, regenerated every run, never committed.

### Consuming storage state in specs

A file-level `test.use({ storageState })` only works when a whole spec file uses one account. Several existing files mix accounts (`product-images.spec.ts`, `sort-dropdown.spec.ts`, `add-to-cart.spec.ts`, `checkout.spec.ts`), so those get per-account `test.describe` blocks, each with its own scoped `test.use()`:

```ts
test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });
  test('sorts a-z', async ({ page }) => { ... });
});

test.describe('problem_user', () => {
  test.use({ storageState: '.auth/problem_user.json' });
  test('sort has no effect (bug)', async ({ page }) => { ... });
});
```

Single-account files (`view-cart.spec.ts`, `footer-social-links.spec.ts`, `visual-user-bugs.spec.ts`, snapshot specs, etc.) use a file-level `test.use()` instead of wrapping everything in a redundant `describe`.

### Shared helpers

Helpers that currently perform login as their first step (`checkoutBackpack()`, `reachCheckoutStepOne()` in `checkout.spec.ts`, and equivalents in other specs) change to start from `page.goto('/inventory.html')` instead, since the storage state already carries the authenticated session — no login step needed, but a navigation is still required because storage state restores cookies/localStorage, not browser navigation position.

## Migration scope

**Converted to storage state** (login-as-precondition only):
- `tests/cart/add-to-cart.spec.ts`
- `tests/cart/view-cart.spec.ts`
- `tests/cart/checkout.spec.ts`
- `tests/filter/sort-dropdown.spec.ts`
- `tests/inventory/product-images.spec.ts`
- `tests/inventory/product-details.spec.ts`
- `tests/inventory/footer-social-links.spec.ts`
- `tests/inventory/visual-user-bugs.spec.ts`
- `tests/snapshot/**` (all specs — each currently logs in to reach the page being screenshotted)

**Left untouched** (login is the subject under test):
- `tests/login/login.spec.ts`
- The `performance_glitch_user` timing test

## Compatibility with existing npm scripts

`package.json` currently has:
- `test:functional` — path-filtered (`playwright test tests/cart tests/filter tests/inventory tests/login`)
- `test:snapshot` — `playwright test tests/snapshot --project=chromium`

Playwright resolves project `dependencies` independent of path filters or `--project` selection, so both scripts should still correctly trigger the `setup` project first without any script changes. This will be verified live during implementation rather than assumed, since it's the one part of this design not confirmed against current Playwright behavior in this repo.

## Testing / Verification

- Run the full suite after migration (`npm test`) and confirm the same pass count as the current baseline (74 passing / 4 skipped).
- Confirm `.auth/*.json` files are generated fresh on a clean run (delete `.auth/` and re-run).
- Confirm the `setup` project appears as its own step in the HTML report.
- Confirm `npm run test:functional` and `npm run test:snapshot` still trigger `setup` correctly (the compatibility point above).

## Risks / open questions

- None outstanding — the one uncertain point (npm script + dependency interaction) is called out above and will be confirmed during implementation, not assumed.
