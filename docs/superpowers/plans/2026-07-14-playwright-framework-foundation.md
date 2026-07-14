# Playwright Framework Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a TypeScript Playwright test framework against
`https://www.saucedemo.com/` with a Page Object Model structure, and
prove it works with one passing test: "homepage loads successfully."

> **Amendment (2026-07-14):** Originally targeted
> `https://demo.nopcommerce.com/`. That site started returning a
> Cloudflare "verifying you are human" challenge to all traffic —
> confirmed site-wide via a plain browser check, not automation-specific
> — so the target was switched to Sauce Demo. Task 1 was already
> committed against the old base URL and is corrected below (Task 1a).
> Task 2 was never committed (the implementer correctly refused to commit
> an unverified "passes on all browsers" claim) and is rewritten in full
> for the new target.

**Architecture:** `@playwright/test` + TypeScript. `playwright.config.ts`
holds the base URL, three browser projects, and the HTML reporter.
`pages/` holds Page Object classes; `tests/` holds spec files that consume
them. No fixtures yet — added later only when a real shared fixture is
needed.

**Tech Stack:** `@playwright/test`, TypeScript, Node.js/npm.

## Global Constraints

- Base URL: `https://www.saucedemo.com` (no trailing slash, set via
  `use.baseURL` in config; tests navigate with relative paths)
- Browser projects: Chromium, Firefox, WebKit (all three, from the start)
- Reporter: Playwright's built-in HTML reporter
- Language: TypeScript
- Structure: Page Object Model — `pages/` for page classes, `tests/` for
  specs, no `fixtures/` directory yet
- Repo already initialized (`git init` done, one commit present with the
  design spec)

---

### Task 1: Project scaffolding — npm, Playwright, TypeScript, config

**Files:**
- Create: `package.json` (via `npm init -y`, then edited)
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `playwright.config.ts`

**Interfaces:**
- Produces: a working `npx playwright test` command-line entry point,
  `baseURL` of `https://demo.nopcommerce.com`, three projects named
  `chromium`, `firefox`, `webkit`, `testDir: './tests'`. Task 2 relies on
  all of these existing exactly as named.

- [ ] **Step 1: Initialize the npm project**

Run: `npm init -y`

Expected: creates `package.json` with default fields.

- [ ] **Step 2: Install Playwright Test and TypeScript**

Run: `npm install -D @playwright/test typescript @types/node`

Expected: `node_modules/` created, `package.json` now lists these three
under `devDependencies`.

- [ ] **Step 3: Install browser binaries**

Run: `npx playwright install chromium firefox webkit`

Expected: downloads and installs the three browser binaries; command
exits 0.

- [ ] **Step 4: Add a `test` script to package.json**

Open `package.json` and add a `scripts` entry:

```json
{
  "scripts": {
    "test": "playwright test"
  }
}
```

(Merge into the existing `scripts` object `npm init -y` created — don't
overwrite the whole file.)

- [ ] **Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "lib": ["ES2021"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node", "@playwright/test"]
  },
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
test-results/
playwright-report/
blob-report/
playwright/.cache/
```

- [ ] **Step 7: Create playwright.config.ts**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'https://demo.nopcommerce.com',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

- [ ] **Step 8: Verify the config loads correctly**

Run: `npx playwright test --list`

Expected: Playwright starts, parses the config without error, and
reports no tests found (there are no spec files yet) — e.g. `Error: No
tests found`. This confirms the config file is syntactically valid and
`testDir`/projects are wired up; it is expected to report zero tests at
this stage, not to fail on a config error.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore playwright.config.ts
git commit -m "$(cat <<'EOF'
Scaffold Playwright + TypeScript framework config

npm project with @playwright/test, three browser projects
(chromium/firefox/webkit), base URL set to the nopCommerce demo store,
and HTML reporter.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1a: Correct base URL after site switch

**Files:**
- Modify: `playwright.config.ts`

**Interfaces:**
- Produces: `use.baseURL` of `https://www.saucedemo.com`. Task 2 relies on
  this exact value.

- [ ] **Step 1: Update the base URL**

In `playwright.config.ts`, change:

```ts
    baseURL: 'https://demo.nopcommerce.com',
```

to:

```ts
    baseURL: 'https://www.saucedemo.com',
```

No other lines in the file change.

- [ ] **Step 2: Verify the config still loads correctly**

Run: `npx playwright test --list`

Expected: same as Task 1 Step 8 — parses without error, reports no tests
found (no spec files exist yet).

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "$(cat <<'EOF'
Switch base URL to Sauce Demo

demo.nopcommerce.com started returning a Cloudflare bot-challenge to all
traffic (confirmed site-wide, not automation-specific). Sauce Demo
(saucedemo.com) is purpose-built for test automation practice and has no
such block.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: HomePage page object and homepage-load test (TDD)

Sauce Demo's `/` is a login screen (Sauce Labs' "Swag Labs" app). No auth
flow is in scope here — "homepage loads" means the login screen itself
rendered correctly. Confirmed live (via a direct Playwright script against
the real site) that the rendered page has: `page.title()` === `"Swag
Labs"`, and a `.login_logo` element containing the text `"Swag Labs"`.

**Files:**
- Create: `pages/HomePage.ts`
- Create: `tests/home.spec.ts`

**Interfaces:**
- Consumes: `playwright.config.ts` from Task 1/1a (`baseURL`, `testDir`,
  three browser projects).
- Produces: `HomePage` class (`pages/HomePage.ts`) with:
  - `constructor(page: Page)`
  - `readonly logo: Locator`
  - `async goto(): Promise<void>` — navigates to `/`

- [ ] **Step 1: Write the failing test**

Create `tests/home.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test('homepage loads successfully', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await expect(homePage.logo).toBeVisible();
  await expect(page).toHaveTitle('Swag Labs');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test home.spec.ts --project=chromium`

Expected: FAIL — `pages/HomePage.ts` does not exist yet, so the import
fails (`Cannot find module '../pages/HomePage'` or equivalent TypeScript
resolution error).

- [ ] **Step 3: Implement HomePage**

Create `pages/HomePage.ts`:

```ts
import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('.login_logo');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
```

- [ ] **Step 4: Run the test to verify it passes on Chromium**

Run: `npx playwright test home.spec.ts --project=chromium`

Expected: PASS (1 passed).

If it fails because the locator doesn't match, open
`https://www.saucedemo.com/` and inspect the logo element's actual class
or accessible text, then update the `.login_logo` selector in
`pages/HomePage.ts` to match what's really rendered.

- [ ] **Step 5: Run the test across all three browsers**

Run: `npx playwright test home.spec.ts`

Expected: PASS on all three projects (3 passed).

- [ ] **Step 6: Commit**

```bash
git add pages/HomePage.ts tests/home.spec.ts
git commit -m "$(cat <<'EOF'
Add HomePage page object and homepage-load test

First end-to-end test proving the framework works: navigates to Sauce
Demo's login screen and asserts the logo is visible and the page title
is correct. Passes on chromium, firefox, and webkit.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---
