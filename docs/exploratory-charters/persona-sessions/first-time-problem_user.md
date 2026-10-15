# Persona session: first-time × problem_user

**Mission:** As a first-time visitor who relies only on what the screen shows, try to buy one product I like on saucedemo.com while logged in as `problem_user`, and record every point where what's displayed is inconsistent or an action gives no feedback.
**Persona:** first-time | **Account:** problem_user | **Focus:** open

**Date:** 2026-10-15 | **Viewport:** 1280×800, Chromium (Playwright MCP) | **Budget:** ~30 browser tool calls (36 used, see Session Notes)

## Session Notes

- Logged in as `problem_user`. On the inventory page, every product card shows **the same photo of a pug holding a tennis ball**, whatever the product (screenshot `screenshots/first-time-problem_user-01-inventory.png`). A first-time shopper can't use the pictures to choose, so I chose by text.
- **Attempt 1, Sauce Labs Backpack ($29.99).** I picked it because it had the most practical description ("laptop and tablet protection"). I clicked the product name to open its details page. Nothing visibly happened: the URL stayed `inventory.html` and the page was unchanged (`screenshots/first-time-problem_user-02-after-title-click.png`). As my one alternative, I clicked the product image. That opened `inventory-item.html?id=5`, which shows **Sauce Labs Fleece Jacket, $49.99**, not the Backpack (`screenshots/first-time-problem_user-03-details.png`). Neither route showed the product I clicked, so I counted this as **stuck #1** and abandoned the attempt.
- **Attempt 2, Sauce Labs Fleece Jacket ($49.99).** I picked it because it was the first real product photo I'd seen and the jacket looked nice. I was already on its details page, so I clicked "Add to cart". There was no feedback: the button still said "Add to cart" and the header still read "Cart, empty" (`screenshots/first-time-problem_user-04-after-add.png`). As my one alternative, I opened the cart to check. The cart had only the QTY/Description headers and no items (`screenshots/first-time-problem_user-05-cart.png`). That was **stuck #2**, which ends the session under the persona rules. I never reached checkout, the overview or the complete page.
- **Repro and baseline** (after the session ended, outside the persona):
  - As problem_user I loaded `inventory.html` again and clicked the Backpack **name** link. This time it navigated, to `?id=5` (Fleece Jacket). So the wrong product came up through both the image (run 1) and the name (run 2), but the earlier "name click does nothing" did **not** happen again.
  - On `?id=5` I clicked "Add to cart" again. `browser_evaluate` returned `{ btn: "Add to cart", badge: null, cartStorage: null }`, the same failure as before.
  - I logged out through the menu and logged in as `standard_user`. The Backpack name opens `?id=4` "Sauce Labs Backpack" with image `/assets/sauce-backpack-1200x1500-...jpg`. "Add to cart" there returns `{ btn: "Remove", badge: "1", cartStorage: "[4]" }`, so both defects are specific to problem_user.
  - Limitation: the baseline add-to-cart ran on `id=4` (Backpack), but problem_user's failure was on `id=5` (Fleece Jacket). I didn't run standard_user on `id=5`, so the comparison isn't the same product.
- **Observation that conflicts with the docs:** CHARTER-002 line 19 says problem_user's broken image "shows on every page, not just the inventory grid". In this session the Fleece Jacket details page showed a **real fleece jacket photo**, not the pug placeholder. Either the site has changed or the charter note is wrong.
- **Cleanup:** I ran Reset App State from the menu, but while logged in as `standard_user` (after the baseline), so the Backpack added in the baseline was removed. problem_user's cart was already empty because its add-to-cart never worked. Then I closed the browser.
- **Console:** the inventory and details pages had 2 to 6 console errors. I didn't triage them because this persona's findings don't include console output, and saucedemo logs telemetry errors for every account.
- **Call count:** 21 calls for the persona flow (well within budget), then 15 for the repro, baseline, reset and close. Total 36 against a budget of about 30.

## Findings

| # | Status (new / known BUG-NNN / not a bug) | Severity | Summary | Repro steps | Evidence |
|---|---|---|---|---|---|
| 1 | **new** | High | On a product details page, "Add to cart" does nothing for problem_user. The button doesn't change to "Remove", no cart badge appears, the cart stays empty and `localStorage['cart-contents']` stays `null`. Nothing tells the user it failed. standard_user's details-page add works. | 1. Log in as `problem_user`. 2. Open `inventory-item.html?id=5` (reached by clicking the Backpack). 3. Click "Add to cart". 4. Look at the button, the badge, then open the cart. | Seen in 2 of 2 runs. Snapshot after the add: `button "Add to cart" [active]`, `button "Cart, empty"`. Evaluate: `{"btn":"Add to cart","badge":null,"cartStorage":null}`. Baseline (standard_user, id=4): `{"btn":"Remove","badge":"1","cartStorage":"[4]"}`. Screenshots `screenshots/first-time-problem_user-04-after-add.png`, `screenshots/first-time-problem_user-05-cart.png`. Caveat: the baseline used a different product id (4, not 5). |
| 2 | known BUG-004 | Medium | Clicking Sauce Labs Backpack (name or image) opens the Fleece Jacket details page (`?id=5`, $49.99). | 1. Log in as `problem_user`. 2. Click the Backpack image (or name). 3. Details page shows "Sauce Labs Fleece Jacket". | Seen in 2 of 2 runs (image in run 1, name in run 2). URL `inventory-item.html?id=5`. Screenshot `screenshots/first-time-problem_user-03-details.png`. standard_user goes to `?id=4` "Sauce Labs Backpack". Automated in `tests/inventory/product-details.spec.ts` (`test.fail`, **name link only**; the image route isn't tested). |
| 3 | known BUG-006 | Low | Every inventory card shows the same pug photo, so a shopper can't pick a product by its image. | 1. Log in as `problem_user`. 2. Look at the inventory grid. | Screenshot `screenshots/first-time-problem_user-01-inventory.png` (6 identical pug images). Only screenshotted once this session, but it's already covered by `tests/inventory/product-images.spec.ts` and `tests/snapshot/inventory/problem-user-visual.spec.ts`. |
| 4 | new, **unconfirmed** | Low | The first click on the Backpack's name link gave no feedback: the URL stayed `inventory.html` and the page didn't change. | 1. Log in as `problem_user`. 2. Right after the inventory loads, click "Sauce Labs Backpack" (the name). | Happened in 1 of 2 runs. On the second run the same click went to `?id=5`. Click result URL `https://www.saucedemo.com/inventory.html`, screenshot `screenshots/first-time-problem_user-02-after-title-click.png`. Could be a click that landed before the page was interactive. |
| 5 | not a bug (doc drift) | n/a | The Fleece Jacket details page (`?id=5`) shows the real jacket photo, which contradicts CHARTER-002's note that the broken image appears on every page. | Same as #2, then look at the details image. | Screenshot `screenshots/first-time-problem_user-03-details.png`. CHARTER-002 line 19. |

## Proposed Test Cases

### TC-A: problem_user, Add to cart on the details page doesn't update the cart (finding #1)

- **Target spec:** `tests/cart/add-to-cart.spec.ts` (existing)
- **Fixtures / page objects:** `test` and `expect` from `fixtures/index.ts` (`inventoryPage` fixture). The header and `cartBadge` are shared across pages, so `inventoryPage.cartBadge` works on the details page. `ProductDetailsPage` has no add-to-cart locator yet, so the sketch uses a role locator; a later change should add `addToCartButton` to `pages/ProductDetailsPage.ts`.
- **Steps:** use the problem_user storage state, go to `/inventory-item.html?id=5`, click Add to cart.
- **Assertion:** run the same test as `standard_user` on the **same id** first, so the comparison is fair. That fills the baseline gap from this session.

```ts
import { test, expect } from '../../fixtures';

for (const user of ['standard_user', 'problem_user'] as const) {
  test.describe(user, () => {
    test.use({ storageState: `.auth/${user}.json` });

    const run = user === 'problem_user' ? test.fail : test; // documents the bug; flips if fixed
    run(`${user}: Add to cart on product details updates button and badge`, async ({ page, inventoryPage }) => {
      await page.goto('/inventory-item.html?id=5');
      await page.getByRole('button', { name: 'Add to cart' }).click();
      await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();
      await expect(inventoryPage.cartBadge).toHaveText('1');
    });
  });
}
```

### TC-B: problem_user, Backpack image opens the wrong product (finding #2, BUG-004 image route)

- **Target spec:** `tests/inventory/product-details.spec.ts` (existing). Add it next to the name-link `test.fail`.
- **Page objects:** `InventoryPage.getItemImage()`, `ProductDetailsPage.itemName` / `itemPrice`.
- **Steps:** go to `/inventory.html`, click `getItemImage('Sauce Labs Backpack')`.
- **Assertion:** wrapped in `test.fail()`. `await expect(detailsPage.itemName).toHaveText('Sauce Labs Backpack')`. Today that fails because the page shows "Sauce Labs Fleece Jacket"; if the bug is fixed the test passes and `test.fail()` turns the suite red.

```ts
test.fail('problem_user: clicking the Backpack image opens the wrong product details page', async ({ page }) => {
  await page.goto('/inventory.html');
  await new InventoryPage(page).getItemImage('Sauce Labs Backpack').click();
  await expect(new ProductDetailsPage(page).itemName).toHaveText('Sauce Labs Backpack');
});
```

### TC-C (optional): problem_user details page image isn't the inventory placeholder (finding #5)

- **Target spec:** `tests/inventory/product-images.spec.ts` (existing), `problem_user` describe.
- **Page objects:** `InventoryPage.getItemImageSources()`, plus a details-image locator (`.inventory_details_img`; not in `ProductDetailsPage` yet).
- **Steps:** collect the inventory image `src` values (all identical), open `/inventory-item.html?id=5`, read the details image `src`.
- **Assertion:** `await expect(page.locator('.inventory_details_img')).not.toHaveAttribute('src', placeholderSrc)`. This pins down the observed behaviour so CHARTER-002's note can be corrected. It fails if BUG-006 spreads to the details page.

## Human verification

Finding #1 was re-checked by hand with a same-product baseline (id=5 for both accounts), which
closes the caveat above: `standard_user` adds the Fleece Jacket from its details page; `problem_user`
doesn't. Note that clicking "Sauce Labs Fleece Jacket" from the inventory as `problem_user` lands on
`?id=6` ("ITEM NOT FOUND", BUG-004), where Add to cart works, so reproduce by opening `?id=5`
directly or by clicking the Backpack. Covered by `tests/cart/add-to-cart-from-details.spec.ts`
(TC-A); the Backpack image route (finding #2) by TC-B in `tests/inventory/product-details.spec.ts`.
