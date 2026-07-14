# Authentication Storage State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repeated real-UI-login setup at the top of most tests with Playwright's "setup project" storage-state pattern, so login is only exercised by the tests that are actually about login.

**Architecture:** A new `setup` project (`tests/setup/auth.setup.ts`) logs in once per test account and saves each session to `.auth/<account>.json`. The `chromium`/`firefox`/`webkit` projects declare `dependencies: ['setup']` so it always runs first. Spec files opt in via `test.use({ storageState: '.auth/<account>.json' })`, either file-wide (single-account files) or inside `test.describe` blocks (files that exercise more than one account).

**Tech Stack:** Playwright Test (`@playwright/test`), TypeScript.

## Global Constraints

- Storage states are generated for exactly four accounts: `standard_user`, `problem_user`, `visual_user`, `error_user`. All saucedemo.com test accounts use password `secret_sauce`.
- `locked_out_user` gets no storage state — that account never reaches an authenticated session (its whole test is the failed-login error).
- `performance_glitch_user` gets no storage state — its only test measures login timing itself, so bypassing login defeats the test's purpose.
- `tests/login/login.spec.ts` is never migrated — login behavior is the thing under test there.
- `tests/snapshot/login/locked-out-visual.spec.ts` is never migrated — it logs in as `locked_out_user`, which has no storage state per above.
- `.auth/*.json` files are gitignored — regenerated fresh every run, never committed.
- Use the setup-project pattern (dedicated `setup` project + `dependencies`), not `globalSetup` or a lazy per-test fixture — see `docs/superpowers/specs/2026-07-14-auth-storage-state-design.md` for why.

---

### Task 1: Scaffold the setup project

**Files:**
- Create: `tests/setup/auth.setup.ts`
- Modify: `playwright.config.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `.auth/standard_user.json`, `.auth/problem_user.json`, `.auth/visual_user.json`, `.auth/error_user.json` — storage-state files that every later task's `test.use({ storageState: '.auth/<account>.json' })` depends on by exact path.

- [ ] **Step 1: Capture the pre-migration baseline**

No spec files have been touched yet, so this is the last point where the suite's current shape is still the pre-migration one.

Run: `npx playwright test --reporter=list 2>&1 | tail -20`

Record the final summary line (e.g. `"118 tests, X passed, Y skipped"`, or however Playwright reports it) somewhere you'll reference at the end of Task 10 — a scratch note is fine, this isn't committed. Do not hardcode this number into any file.

- [ ] **Step 2: Create the setup spec**

Create `tests/setup/auth.setup.ts`:

```ts
import { test as setup } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const accounts = ['standard_user', 'problem_user', 'visual_user', 'error_user'] as const;

for (const account of accounts) {
  setup(`authenticate as ${account}`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(account, 'secret_sauce');
    await page.waitForURL(/inventory\.html/);
    await page.context().storageState({ path: `.auth/${account}.json` });
  });
}
```

The `waitForURL` assertion matters: if login silently fails for an account, this makes the setup test itself fail loudly instead of saving a logged-out session that would make every dependent test fail confusingly downstream.

- [ ] **Step 3: Wire the setup project into the config**

In `playwright.config.ts`, replace the `projects` array:

```ts
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: ['**/snapshot/**'], dependencies: ['setup'] },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: ['**/snapshot/**'], dependencies: ['setup'] },
  ],
```

- [ ] **Step 4: Gitignore the generated storage states**

Add a line to `.gitignore` (anywhere after the existing entries):

```
.auth/
```

- [ ] **Step 5: Run the setup project in isolation and verify the files**

Run: `rm -rf .auth && npx playwright test --project=setup`

Expected: 4 passed (one per account, named `authenticate as <account>`).

Run: `ls .auth`

Expected output:
```
error_user.json
problem_user.json
standard_user.json
visual_user.json
```

If `.auth/` doesn't exist or the run errors on the `storageState({ path })` call, create the directory manually (`mkdir -p .auth`) and re-run — Playwright's `storageState()` is documented to create parent directories, but confirm it live rather than assume it.

- [ ] **Step 6: Verify project dependencies survive npm's path/project filters**

This is the one part of the design not yet confirmed against this repo's actual Playwright behavior — confirm it now before building anything on top of it.

Run: `rm -rf .auth && npx playwright test tests/login/login.spec.ts --project=chromium && ls .auth`

Expected: the `login.spec.ts` tests pass (they don't use storage state, so this run doesn't test *them* — it tests whether `setup` still executes as a `chromium` dependency even though the path filter only matches `login.spec.ts`), and `ls .auth` shows all 4 JSON files again, proving the dependency ran despite the narrow path filter.

Then confirm both existing npm scripts still trigger it the same way:

Run: `rm -rf .auth && npm run test:functional > /dev/null 2>&1; ls .auth`
Expected: all 4 JSON files present.

Run: `rm -rf .auth && npm run test:snapshot > /dev/null 2>&1; ls .auth`
Expected: all 4 JSON files present.

- [ ] **Step 7: Run the full suite and confirm no regressions**

Run: `npx playwright test --reporter=list 2>&1 | tail -20`

Expected: same pass/skip counts as the Step 1 baseline, plus 4 additional passing tests from the new `setup` project (no existing spec has been migrated yet, so nothing else should change).

- [ ] **Step 8: Commit**

```bash
git add tests/setup/auth.setup.ts playwright.config.ts .gitignore
git commit -m "$(cat <<'EOF'
Add setup project for per-account storage-state authentication

Introduces tests/setup/auth.setup.ts, which logs in once per test
account and saves the session to .auth/<account>.json. The
chromium/firefox/webkit projects now depend on this setup project so
it always runs first. No existing spec has been migrated to consume
these states yet — this task only builds the mechanism.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Migrate single-account functional specs

**Files:**
- Modify: `tests/cart/view-cart.spec.ts`
- Modify: `tests/inventory/footer-social-links.spec.ts`
- Modify: `tests/inventory/visual-user-bugs.spec.ts`

**Interfaces:**
- Consumes: `.auth/standard_user.json`, `.auth/visual_user.json` (from Task 1).

- [ ] **Step 1: Rewrite `tests/cart/view-cart.spec.ts`**

Replace the full file contents with:

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';

test.use({ storageState: '.auth/standard_user.json' });

// Checks that after adding an item, the cart page displays the right
// product name and price.
test('cart page shows the correct item and price after adding Sauce Labs Backpack', async ({
  page,
}) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  await expect(page).toHaveURL(/.*cart\.html/);

  const cartPage = new CartPage(page);
  await expect(cartPage.itemName).toHaveText('Sauce Labs Backpack');
  await expect(cartPage.itemPrice).toHaveText('$29.99');
});

// Checks that clicking "Remove" on a cart item actually takes it out of the cart.
test('removing an item from the cart page removes it', async ({ page }) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  const cartPage = new CartPage(page);
  await cartPage.getRemoveButton('Sauce Labs Backpack').click();

  await expect(cartPage.itemName).toHaveCount(0);
});
```

- [ ] **Step 2: Rewrite `tests/inventory/footer-social-links.spec.ts`**

Replace the full file contents with:

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.use({ storageState: '.auth/standard_user.json' });

// Checks that the footer's social icons are visible, point to the right
// profile, and open in a new tab rather than navigating away from the app.
test('footer social icons link to the correct profiles and open in a new tab', async ({ page }) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);

  const links: { locator: typeof inventoryPage.twitterLink; href: string }[] = [
    { locator: inventoryPage.twitterLink, href: 'https://twitter.com/saucelabs' },
    { locator: inventoryPage.facebookLink, href: 'https://www.facebook.com/saucelabs' },
    { locator: inventoryPage.linkedinLink, href: 'https://www.linkedin.com/company/sauce-labs/' },
  ];

  for (const { locator, href } of links) {
    await expect(locator).toBeVisible();
    await expect(locator).toHaveAttribute('href', href);
    await expect(locator).toHaveAttribute('target', '_blank');
  }
});
```

- [ ] **Step 3: Rewrite `tests/inventory/visual-user-bugs.spec.ts`**

Replace the full file contents with:

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.use({ storageState: '.auth/visual_user.json' });

// Bug check: for the "visual_user" test account, the shopping cart icon
// in the header renders in the wrong position. For standard_user it sits
// at roughly {x: 1220, y: 10}; for visual_user it renders shifted left
// and down, around {x: 1034, y: 39}. Verified live across repeat loads —
// the icon's malposition is consistent (unlike the price bug below).
test('visual_user: cart icon renders in the wrong position', async ({ page }) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  const cartBox = await inventoryPage.cartIcon.boundingBox();

  expect(cartBox).not.toBeNull();
  // Correct position (matches standard_user) is x: 1220, y: 10. The bug
  // shifts it well away from that, so assert it lands outside a small
  // tolerance of the correct spot.
  expect(Math.abs(cartBox!.x - 1220)).toBeGreaterThan(50);
  expect(Math.abs(cartBox!.y - 10)).toBeGreaterThan(10);
});

// Bug check: for the "visual_user" test account, item prices on the
// inventory page are randomized on every page load instead of showing
// the real prices. Verified live across repeat loads — the same product
// shows a different, incorrect price each time. This test confirms the
// displayed prices don't match the known-correct catalog prices.
test('visual_user: inventory prices do not match the real catalog prices', async ({ page }) => {
  const correctPrices: Record<string, string> = {
    'Sauce Labs Backpack': '$29.99',
    'Sauce Labs Bike Light': '$9.99',
    'Sauce Labs Bolt T-Shirt': '$15.99',
    'Sauce Labs Fleece Jacket': '$49.99',
    'Sauce Labs Onesie': '$7.99',
    'Test.allTheThings() T-Shirt (Red)': '$15.99',
  };

  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);

  let mismatchCount = 0;
  for (const [name, correctPrice] of Object.entries(correctPrices)) {
    const displayedPrice = await inventoryPage.getItemPrice(name).textContent();
    if (displayedPrice?.trim() !== correctPrice) {
      mismatchCount++;
    }
  }

  expect(mismatchCount).toBeGreaterThan(0);
});
```

- [ ] **Step 4: Run the three migrated files and confirm they still pass**

Run: `npx playwright test tests/cart/view-cart.spec.ts tests/inventory/footer-social-links.spec.ts tests/inventory/visual-user-bugs.spec.ts`

Expected: all pass on chromium/firefox/webkit, same as before migration (5 tests × 3 browsers = 15 passed).

If the `visual_user` price-randomization test starts failing (`mismatchCount` stays 0), that means navigating straight to `/inventory.html` with a pre-authenticated session doesn't trigger the same price-randomization path as arriving there via a fresh login redirect — investigate before proceeding rather than loosening the assertion.

- [ ] **Step 5: Commit**

```bash
git add tests/cart/view-cart.spec.ts tests/inventory/footer-social-links.spec.ts tests/inventory/visual-user-bugs.spec.ts
git commit -m "$(cat <<'EOF'
Migrate single-account functional specs to storage-state auth

view-cart, footer-social-links, and visual-user-bugs each only ever
exercised one account as setup, not as the subject under test, so
they swap their real-login block for test.use({ storageState }) plus
a direct page.goto('/inventory.html').

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Migrate single-account snapshot specs

**Files:**
- Modify: `tests/snapshot/cart/add-to-cart-visual.spec.ts`
- Modify: `tests/snapshot/cart/checkout-complete-visual.spec.ts`
- Modify: `tests/snapshot/cart/view-cart-visual.spec.ts`
- Modify: `tests/snapshot/inventory/problem-user-visual.spec.ts`
- Modify: `tests/snapshot/inventory/product-details-visual.spec.ts`
- Modify: `tests/snapshot/inventory/visual-user-visual.spec.ts`

**Interfaces:**
- Consumes: `.auth/standard_user.json`, `.auth/problem_user.json`, `.auth/visual_user.json` (from Task 1).

- [ ] **Step 1: Rewrite `tests/snapshot/cart/add-to-cart-visual.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../../pages/InventoryPage';

test.use({ storageState: '.auth/standard_user.json' });

// Visual check: takes a screenshot of the Products page after adding an
// item, and compares it pixel-for-pixel against a saved reference image
// to catch unexpected visual changes.
test('inventory page after adding Sauce Labs Backpack to cart matches baseline', async ({
  page,
}) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();

  await expect(page).toHaveScreenshot('inventory-after-add-to-cart.png', {
    fullPage: true,
  });
});
```

- [ ] **Step 2: Rewrite `tests/snapshot/cart/checkout-complete-visual.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../../pages/InventoryPage';
import { CartPage } from '../../../pages/CartPage';
import { CheckoutStepOnePage } from '../../../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../../../pages/CheckoutStepTwoPage';

test.use({ storageState: '.auth/standard_user.json' });

// Visual check: takes a screenshot of the order confirmation page after
// completing checkout, and compares it pixel-for-pixel against a saved
// reference image to catch unexpected visual changes.
test('checkout-complete page after finishing an order matches baseline', async ({
  page,
}) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  const cartPage = new CartPage(page);
  await cartPage.checkoutButton.click();

  const stepOnePage = new CheckoutStepOnePage(page);
  await stepOnePage.fillInfo('John', 'Doe', '12345');
  await stepOnePage.continueButton.click();

  const stepTwoPage = new CheckoutStepTwoPage(page);
  await stepTwoPage.finishButton.click();

  await expect(page).toHaveURL(/.*checkout-complete\.html/);
  await expect(page).toHaveScreenshot('checkout-complete.png', {
    fullPage: true,
  });
});
```

- [ ] **Step 3: Rewrite `tests/snapshot/cart/view-cart-visual.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../../pages/InventoryPage';

test.use({ storageState: '.auth/standard_user.json' });

// Visual check: takes a screenshot of the cart page with an item in it,
// and compares it pixel-for-pixel against a saved reference image to
// catch unexpected visual changes.
test('cart page with Sauce Labs Backpack matches baseline', async ({
  page,
}) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  await expect(page).toHaveScreenshot('cart-page-with-backpack.png', {
    fullPage: true,
  });
});
```

- [ ] **Step 4: Rewrite `tests/snapshot/inventory/problem-user-visual.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/problem_user.json' });

// Visual check: takes a screenshot of the Products page for problem_user,
// and compares it pixel-for-pixel against a saved reference image. Locks
// in the known broken-image bug (every product tile shows the same
// broken picture instead of its own) so a fix or worsening shows up as
// a diff.
test('problem_user inventory page matches baseline (same broken image on every product)', async ({
  page,
}) => {
  await page.goto('/inventory.html');

  await expect(page).toHaveScreenshot('problem-user-inventory.png', {
    fullPage: true,
  });
});
```

- [ ] **Step 5: Rewrite `tests/snapshot/inventory/product-details-visual.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../../pages/InventoryPage';

test.use({ storageState: '.auth/standard_user.json' });

// Visual check: takes a screenshot of a product's details page, and
// compares it pixel-for-pixel against a saved reference image to catch
// unexpected visual changes.
test('Sauce Labs Backpack details page matches baseline', async ({ page }) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getItemNameLink('Sauce Labs Backpack').click();

  await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);
  await expect(page).toHaveScreenshot('product-details-backpack.png', {
    fullPage: true,
  });
});
```

- [ ] **Step 6: Rewrite `tests/snapshot/inventory/visual-user-visual.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/visual_user.json' });

// Visual check: takes a screenshot of the Products page for visual_user,
// and compares it pixel-for-pixel against a saved reference image. Locks
// in the known cart-icon-misplacement bug so a fix (or worsening) shows
// up as a diff. Prices are hidden via CSS (rather than Playwright's
// bounding-box mask) because visual_user's price bug re-randomizes the
// displayed values, including their digit count, on every page load — a
// bounding-box mask shifts size with the text and leaves inconsistent
// slivers visible, but hiding the text color removes it without
// affecting layout.
test('visual_user inventory page matches baseline (misplaced cart icon)', async ({
  page,
}) => {
  await page.goto('/inventory.html');

  await page.addStyleTag({
    content: '.inventory_item_price { color: transparent !important; }',
  });

  await expect(page).toHaveScreenshot('visual-user-inventory.png', {
    fullPage: true,
  });
});
```

- [ ] **Step 7: Run all six migrated snapshot specs**

Run: `npx playwright test tests/snapshot --project=chromium`

Expected: all 6 pass against their existing committed baselines, unchanged — the final page state each screenshot captures is identical whether reached via a fresh login redirect or a direct `page.goto('/inventory.html')` with a restored session, so no baseline should need regenerating.

If any fail with a pixel diff, inspect it with `npx playwright show-report` first. Only if the diff is a benign artifact (not a real regression) should you regenerate: `npx playwright test <file> --project=chromium --update-snapshots`, then re-review the new PNG before committing it.

- [ ] **Step 8: Commit**

```bash
git add tests/snapshot
git commit -m "$(cat <<'EOF'
Migrate single-account snapshot specs to storage-state auth

Each of these snapshot specs only ever used one account as setup to
reach the page being screenshotted. Swaps the real-login block for
test.use({ storageState }) plus a direct page.goto('/inventory.html').

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Migrate `tests/inventory/product-images.spec.ts`

**Files:**
- Modify: `tests/inventory/product-images.spec.ts`

**Interfaces:**
- Consumes: `.auth/standard_user.json`, `.auth/problem_user.json` (from Task 1).

- [ ] **Step 1: Rewrite the file with per-account describe blocks**

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Checks that a normal user sees a different picture for every product (no duplicates).
  test('standard_user sees a distinct image for each product', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const srcs = await inventoryPage.getItemImageSources();

    expect(new Set(srcs).size).toBe(srcs.length);
  });
});

test.describe('problem_user', () => {
  test.use({ storageState: '.auth/problem_user.json' });

  // Bug check: for the "problem_user" test account, every product shows the
  // exact same (broken) picture instead of its own image.
  test('problem_user is served the same broken image for every product', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const srcs = await inventoryPage.getItemImageSources();

    expect(new Set(srcs).size).toBe(1);
  });
});
```

- [ ] **Step 2: Run and confirm both tests still pass under their correct accounts**

Run: `npx playwright test tests/inventory/product-images.spec.ts`

Expected: 2 tests × 3 browsers = 6 passed. Specifically confirm in the output that `standard_user sees a distinct image for each product` passed (not just that some test passed) — this is the case a wrong-account mistake would silently break.

- [ ] **Step 3: Commit**

```bash
git add tests/inventory/product-images.spec.ts
git commit -m "$(cat <<'EOF'
Migrate product-images.spec.ts to storage-state auth

This file mixes standard_user and problem_user, so each gets its own
test.describe block with a scoped test.use({ storageState }) instead
of a shared file-level one.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Migrate `tests/filter/sort-dropdown.spec.ts`

**Files:**
- Modify: `tests/filter/sort-dropdown.spec.ts`

**Interfaces:**
- Consumes: `.auth/standard_user.json`, `.auth/problem_user.json` (from Task 1).

- [ ] **Step 1: Rewrite the file with per-account describe blocks**

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Checks that the "Name (A to Z)" sort option puts products in alphabetical order.
  test('sorting by Name (A to Z) reorders items', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy('az');

    await expect(inventoryPage.firstItemName).toHaveText('Sauce Labs Backpack');
    await expect(inventoryPage.lastItemName).toHaveText('Test.allTheThings() T-Shirt (Red)');
  });

  // Checks that the "Name (Z to A)" sort option puts products in reverse alphabetical order.
  test('sorting by Name (Z to A) reorders items', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy('za');

    await expect(inventoryPage.firstItemName).toHaveText('Test.allTheThings() T-Shirt (Red)');
    await expect(inventoryPage.lastItemName).toHaveText('Sauce Labs Backpack');
  });

  // Checks that the "Price (low to high)" sort option puts the cheapest product first.
  test('sorting by Price (low to high) reorders items', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy('lohi');

    await expect(inventoryPage.firstItemName).toHaveText('Sauce Labs Onesie');
    await expect(inventoryPage.lastItemName).toHaveText('Sauce Labs Fleece Jacket');
  });

  // Checks that the "Price (high to low)" sort option puts the most expensive product first.
  test('sorting by Price (high to low) reorders items', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await expect(inventoryPage.firstItemName).toHaveText('Sauce Labs Backpack');

    await inventoryPage.sortBy('hilo');

    await expect(inventoryPage.firstItemName).toHaveText('Sauce Labs Fleece Jacket');
  });
});

test.describe('problem_user', () => {
  test.use({ storageState: '.auth/problem_user.json' });

  // Bug check: for the "problem_user" test account, sorting is broken and
  // doesn't change the product order at all. This test confirms that known bug.
  test('problem_user: sorting has no effect on item order', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const beforeSort = await inventoryPage.getItemNames();

    await inventoryPage.sortBy('za');

    const afterSort = await inventoryPage.getItemNames();
    expect(afterSort).toEqual(beforeSort);
  });
});
```

- [ ] **Step 2: Run and confirm all five tests still pass under their correct accounts**

Run: `npx playwright test tests/filter/sort-dropdown.spec.ts`

Expected: 5 tests × 3 browsers = 15 passed.

- [ ] **Step 3: Commit**

```bash
git add tests/filter/sort-dropdown.spec.ts
git commit -m "$(cat <<'EOF'
Migrate sort-dropdown.spec.ts to storage-state auth

This file mixes standard_user and problem_user, so each gets its own
test.describe block with a scoped test.use({ storageState }) instead
of a shared file-level one.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Migrate `tests/cart/add-to-cart.spec.ts`

**Files:**
- Modify: `tests/cart/add-to-cart.spec.ts`

**Interfaces:**
- Consumes: `.auth/standard_user.json`, `.auth/error_user.json` (from Task 1).

- [ ] **Step 1: Rewrite the file with per-account describe blocks**

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Checks that adding one item to the cart makes the cart icon show "1".
  test('adds Sauce Labs Backpack to cart', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();

    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  // Checks that adding two different items shows a cart count of "2", and
  // that the cart page lists both items with their correct prices.
  test('adds multiple items to cart and shows both with correct prices', async ({
    page,
  }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
    await inventoryPage.getAddToCartButton('Sauce Labs Bolt T-Shirt').click();

    await expect(inventoryPage.cartBadge).toHaveText('2');

    await inventoryPage.cartIcon.click();
    await expect(page).toHaveURL(/.*cart\.html/);

    const cartPage = new CartPage(page);
    await expect(cartPage.itemName).toHaveCount(2);
    await expect(cartPage.getItemPrice('Sauce Labs Backpack')).toHaveText('$29.99');
    await expect(cartPage.getItemPrice('Sauce Labs Bolt T-Shirt')).toHaveText('$15.99');
  });

  // Checks that adding an item swaps its inventory-page button from "Add to
  // cart" to "Remove".
  test('shows a Remove button on the inventory page after adding an item to cart', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();

    await expect(inventoryPage.getRemoveButton('Sauce Labs Backpack')).toHaveText('Remove');
  });

  // Checks that clicking Remove on the inventory page takes the item out of
  // the cart and swaps the button back to "Add to cart".
  test('clicking Remove on the inventory page removes the item from the cart and reverts the button', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await inventoryPage.getRemoveButton('Sauce Labs Backpack').click();

    await expect(inventoryPage.cartBadge).toHaveCount(0);
    await expect(inventoryPage.getAddToCartButton('Sauce Labs Backpack')).toHaveText('Add to cart');
  });
});

test.describe('error_user', () => {
  test.use({ storageState: '.auth/error_user.json' });

  // Bug check: for the "error_user" test account, clicking "Add to cart" on
  // certain items (Sauce Labs Bolt T-Shirt, Sauce Labs Fleece Jacket,
  // Test.allTheThings() T-Shirt (Red)) silently fails — the button stays
  // "Add to cart" and the item never reaches the cart. Verified live: 3 of
  // 6 items add successfully, 3 don't, so the cart badge caps at "3" even
  // after clicking every item's button. This test confirms that known bug.
  test('error_user: cannot add all items to the cart', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const itemNames = await inventoryPage.getItemNames();

    for (const name of itemNames) {
      await inventoryPage.getAddToCartButton(name).click();
    }

    await expect(inventoryPage.cartBadge).toHaveText('3');

    await expect(inventoryPage.getRemoveButton('Sauce Labs Backpack')).toHaveText('Remove');
    await expect(inventoryPage.getRemoveButton('Sauce Labs Bike Light')).toHaveText('Remove');
    await expect(inventoryPage.getAddToCartButton('Sauce Labs Bolt T-Shirt')).toHaveText('Add to cart');
    await expect(inventoryPage.getAddToCartButton('Sauce Labs Fleece Jacket')).toHaveText('Add to cart');
    await expect(inventoryPage.getRemoveButton('Sauce Labs Onesie')).toHaveText('Remove');
    await expect(inventoryPage.getAddToCartButton('Test.allTheThings() T-Shirt (Red)')).toHaveText('Add to cart');
  });
});
```

- [ ] **Step 2: Run and confirm all five tests still pass under their correct accounts**

Run: `npx playwright test tests/cart/add-to-cart.spec.ts`

Expected: 5 tests × 3 browsers = 15 passed.

- [ ] **Step 3: Commit**

```bash
git add tests/cart/add-to-cart.spec.ts
git commit -m "$(cat <<'EOF'
Migrate add-to-cart.spec.ts to storage-state auth

This file mixes standard_user and error_user, so each gets its own
test.describe block with a scoped test.use({ storageState }) instead
of a shared file-level one.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Migrate `tests/inventory/product-details.spec.ts`

**Files:**
- Modify: `tests/inventory/product-details.spec.ts`

**Interfaces:**
- Consumes: `.auth/standard_user.json`, `.auth/problem_user.json` (from Task 1).

- [ ] **Step 1: Rewrite the file with per-account describe blocks**

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Checks that clicking a product's image takes you to that product's own
  // details page, showing the matching name and price.
  test('clicking a product image opens its details page with matching name and price', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const expectedPrice = await inventoryPage.getItemPrice('Sauce Labs Backpack').textContent();

    await inventoryPage.getItemImage('Sauce Labs Backpack').click();

    await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);

    const detailsPage = new ProductDetailsPage(page);
    await expect(detailsPage.itemName).toHaveText('Sauce Labs Backpack');
    await expect(detailsPage.itemPrice).toHaveText(expectedPrice ?? '');
  });

  // Checks that clicking a product's name takes you to that product's own
  // details page, showing the matching name and price.
  test('clicking a product name opens its details page with matching name and price', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const expectedPrice = await inventoryPage.getItemPrice('Sauce Labs Backpack').textContent();

    await inventoryPage.getItemNameLink('Sauce Labs Backpack').click();

    await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);

    const detailsPage = new ProductDetailsPage(page);
    await expect(detailsPage.itemName).toHaveText('Sauce Labs Backpack');
    await expect(detailsPage.itemPrice).toHaveText(expectedPrice ?? '');
  });
});

test.describe('problem_user', () => {
  test.use({ storageState: '.auth/problem_user.json' });

  // Bug check: for the "problem_user" test account, clicking on "Sauce Labs
  // Backpack" navigates to the wrong product's details page ("Sauce Labs
  // Fleece Jacket" instead). Marked test.fail() so this documents the known
  // bug without turning the suite red; it will flag loudly if the bug is
  // ever fixed and this assertion starts passing for real.
  test.fail(
    'problem_user: clicking Sauce Labs Backpack opens the wrong product details page',
    async ({ page }) => {
      await page.goto('/inventory.html');

      const inventoryPage = new InventoryPage(page);
      await inventoryPage.getItemNameLink('Sauce Labs Backpack').click();

      await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);

      const detailsPage = new ProductDetailsPage(page);
      await expect(detailsPage.itemName).toHaveText('Sauce Labs Backpack');
    }
  );
});
```

- [ ] **Step 2: Run and confirm all three tests still behave correctly**

Run: `npx playwright test tests/inventory/product-details.spec.ts`

Expected: 3 tests × 3 browsers = 9 "passed" in Playwright's summary (the `test.fail()` case counts as passed when its assertion fails as expected — that's the whole point of the annotation). Confirm specifically that the two `standard_user` tests pass for real (correct name/price asserted true) and the `problem_user` test's underlying assertion is still the one *failing* (i.e. the bug is still present) — check the HTML report if the list reporter's output is ambiguous.

- [ ] **Step 3: Commit**

```bash
git add tests/inventory/product-details.spec.ts
git commit -m "$(cat <<'EOF'
Migrate product-details.spec.ts to storage-state auth

This file mixes standard_user and problem_user, so each gets its own
test.describe block with a scoped test.use({ storageState }) instead
of a shared file-level one. This file was missed in the original
design spec's mixed-account list and added back after review.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Migrate `tests/cart/checkout.spec.ts`

**Files:**
- Modify: `tests/cart/checkout.spec.ts`

**Interfaces:**
- Consumes: `.auth/standard_user.json`, `.auth/error_user.json` (from Task 1).

- [ ] **Step 1: Rewrite the file with per-account describe blocks**

The `checkoutBackpack()` and `reachCheckoutStepOne()` helpers are hardcoded to `standard_user`, so both they and their callers move inside the `standard_user` describe block. They stay defined at module scope (they're plain functions taking `page` as a parameter, not `test()` calls, so they don't need their own fixture scope — they just operate on whatever `page` the calling test passes in).

```ts
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutStepOnePage } from '../../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../../pages/CheckoutStepTwoPage';
import { CheckoutCompletePage } from '../../pages/CheckoutCompletePage';

async function checkoutBackpack(page: import('@playwright/test').Page) {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  const cartPage = new CartPage(page);
  await cartPage.checkoutButton.click();

  const stepOnePage = new CheckoutStepOnePage(page);
  await stepOnePage.fillInfo('John', 'Doe', '12345');
  await stepOnePage.continueButton.click();

  const stepTwoPage = new CheckoutStepTwoPage(page);
  await stepTwoPage.finishButton.click();
}

async function reachCheckoutStepOne(page: import('@playwright/test').Page) {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  const cartPage = new CartPage(page);
  await cartPage.checkoutButton.click();
}

function todayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Checks that going through checkout with an item carries the correct
  // price all the way to the order summary step.
  test('completes checkout info steps with correct item total', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const backpackPrice = await inventoryPage
      .getItemPrice('Sauce Labs Backpack')
      .textContent();
    await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
    await inventoryPage.cartIcon.click();

    const cartPage = new CartPage(page);
    await cartPage.checkoutButton.click();

    await expect(page).toHaveURL(/.*checkout-step-one\.html/);

    const stepOnePage = new CheckoutStepOnePage(page);
    await stepOnePage.fillInfo('John', 'Doe', '12345');
    await stepOnePage.continueButton.click();

    await expect(page).toHaveURL(/.*checkout-step-two\.html/);

    const stepTwoPage = new CheckoutStepTwoPage(page);
    await expect(stepTwoPage.itemName).toHaveText('Sauce Labs Backpack');
    await expect(stepTwoPage.itemTotal).toHaveText(`Item total: ${backpackPrice}`);
  });

  // Checks that completing a purchase shows the "Thank you for your order!"
  // confirmation page with its buttons.
  test('finishing checkout shows the order confirmation page', async ({ page }) => {
    await checkoutBackpack(page);

    await expect(page).toHaveURL(/.*checkout-complete\.html/);

    const completePage = new CheckoutCompletePage(page);
    await expect(completePage.thankYouMessage).toHaveText(
      'Thank you for your order!'
    );
    await expect(completePage.backHomeButton).toBeVisible();
    await expect(completePage.generatePdfButton).toBeVisible();
  });

  // Checks that leaving "First Name" blank on the checkout form blocks
  // checkout and shows the right error message.
  test('checkout step one requires a first name', async ({ page }) => {
    await reachCheckoutStepOne(page);

    const stepOnePage = new CheckoutStepOnePage(page);
    await stepOnePage.lastNameInput.fill('Doe');
    await stepOnePage.zipInput.fill('12345');
    await stepOnePage.continueButton.click();

    await expect(stepOnePage.errorMessage).toHaveText('Error: First Name is required');
    await expect(page).toHaveURL(/.*checkout-step-one\.html/);
  });

  // Checks that leaving "Last Name" blank on the checkout form blocks
  // checkout and shows the right error message.
  test('checkout step one requires a last name', async ({ page }) => {
    await reachCheckoutStepOne(page);

    const stepOnePage = new CheckoutStepOnePage(page);
    await stepOnePage.firstNameInput.fill('John');
    await stepOnePage.zipInput.fill('12345');
    await stepOnePage.continueButton.click();

    await expect(stepOnePage.errorMessage).toHaveText('Error: Last Name is required');
    await expect(page).toHaveURL(/.*checkout-step-one\.html/);
  });

  // Checks that leaving "Postal Code" blank on the checkout form blocks
  // checkout and shows the right error message.
  test('checkout step one requires a postal code', async ({ page }) => {
    await reachCheckoutStepOne(page);

    const stepOnePage = new CheckoutStepOnePage(page);
    await stepOnePage.firstNameInput.fill('John');
    await stepOnePage.lastNameInput.fill('Doe');
    await stepOnePage.continueButton.click();

    await expect(stepOnePage.errorMessage).toHaveText('Error: Postal Code is required');
    await expect(page).toHaveURL(/.*checkout-step-one\.html/);
  });

  // Checks that clicking "Generate PDF order" on the confirmation page
  // actually downloads a file, named with today's date.
  test('generating a PDF order downloads a file dated today', async ({ page }) => {
    await checkoutBackpack(page);

    const completePage = new CheckoutCompletePage(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      completePage.generatePdfButton.click(),
    ]);

    const filename = download.suggestedFilename();
    const expectedPattern = new RegExp(
      `^swag-labs-order-${todayDateString()}_\\d{2}-\\d{2}-\\d{2}\\.pdf$`
    );

    expect(filename).toMatch(expectedPattern);
    expect(await download.path()).toBeTruthy();
  });
});

test.describe('error_user', () => {
  test.use({ storageState: '.auth/error_user.json' });

  // Bug check: for the "error_user" test account, the "Last Name" field on
  // checkout-step-one silently rejects input — neither `fill()` nor typing
  // keystrokes leave any value in it, even though the field isn't disabled
  // or readonly. Verified live and reproducible. This test confirms that
  // known bug.
  test('error_user: cannot type a last name on checkout step one', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
    await inventoryPage.cartIcon.click();

    const cartPage = new CartPage(page);
    await cartPage.checkoutButton.click();

    await expect(page).toHaveURL(/.*checkout-step-one\.html/);

    const stepOnePage = new CheckoutStepOnePage(page);
    await stepOnePage.lastNameInput.fill('Doe');
    await expect(stepOnePage.lastNameInput).toHaveValue('');

    await stepOnePage.lastNameInput.pressSequentially('Doe');
    await expect(stepOnePage.lastNameInput).toHaveValue('');
  });
});
```

- [ ] **Step 2: Run and confirm all seven tests still pass under their correct accounts**

Run: `npx playwright test tests/cart/checkout.spec.ts`

Expected: 7 tests × 3 browsers = 21 passed. Pay particular attention to the PDF-download test and the order-confirmation test — both call `checkoutBackpack()`, so confirm both still complete the full checkout flow correctly with the pre-authenticated session.

- [ ] **Step 3: Commit**

```bash
git add tests/cart/checkout.spec.ts
git commit -m "$(cat <<'EOF'
Migrate checkout.spec.ts to storage-state auth

This file mixes standard_user and error_user, so each gets its own
test.describe block with a scoped test.use({ storageState }). The
standard_user-only checkoutBackpack() and reachCheckoutStepOne()
helpers move inside that describe block along with their callers,
and drop their login step in favor of the restored session.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Final verification and documentation

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing new — this task verifies the combined output of Tasks 1–8.

- [ ] **Step 1: Run the full suite and compare to the Task 1 baseline**

Run: `npx playwright test --reporter=list 2>&1 | tail -20`

Expected: pass/skip counts match the Step 1 baseline recorded in Task 1, plus 4 additional passing tests from the `setup` project. No new failures, no new skips.

- [ ] **Step 2: Re-run both npm convenience scripts end-to-end**

Run: `npm run test:functional`
Expected: same result as running those same paths directly before migration — all still pass, now using restored sessions instead of live logins.

Run: `npm run test:snapshot`
Expected: all snapshot tests still pass against their existing baselines.

- [ ] **Step 3: Confirm the setup project shows in the HTML report**

Run: `npx playwright show-report`

Expected: the report includes a `setup` project section with the 4 `authenticate as <account>` tests, distinct from the `chromium`/`firefox`/`webkit` project results.

- [ ] **Step 4: Update `README.md`**

In the `## Project Structure` code block, change:

```
pages/      Page object models (LoginPage, InventoryPage, CartPage, CheckoutStepOnePage, CheckoutStepTwoPage, CheckoutCompletePage, ProductDetailsPage)
tests/      Functional tests, organized by feature (login, inventory, cart, filter)
tests/snapshot/   Visual regression tests (Chromium only), organized to mirror tests/
```

to:

```
pages/      Page object models (LoginPage, InventoryPage, CartPage, CheckoutStepOnePage, CheckoutStepTwoPage, CheckoutCompletePage, ProductDetailsPage)
tests/setup/  Auth setup project — logs in once per test account, saves session state to .auth/ for reuse
tests/      Functional tests, organized by feature (login, inventory, cart, filter)
tests/snapshot/   Visual regression tests (Chromium only), organized to mirror tests/
```

Then add a new section directly after `## Project Structure` (before `## Bugs Documented`):

```markdown
## Authentication

Most tests don't need to exercise the login form — they reuse a saved session instead. A dedicated `setup` project (`tests/setup/auth.setup.ts`) logs in once per account (`standard_user`, `problem_user`, `visual_user`, `error_user`) before the main test projects run, saving each session to `.auth/<account>.json` (gitignored, regenerated every run). Spec files opt in with `test.use({ storageState: '.auth/<account>.json' })`, either at the top of the file for single-account specs or inside a `test.describe` block when a file covers more than one account.

Two cases always drive the real login form instead: `tests/login/login.spec.ts` (login behavior is the thing under test) and the `locked_out_user` account (it never reaches an authenticated session, so no storage state exists for it).
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
Document the storage-state authentication pattern in README

Adds tests/setup/ to the project structure diagram and a new
Authentication section explaining the setup-project pattern and
which specs still use the real login form.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
