import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutStepOnePage } from '../../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../../pages/CheckoutStepTwoPage';

// These pages only exist mid-flow — there's no direct URL to jump to
// checkout step two or the complete page, so each test walks the same
// add-to-cart -> checkout -> fill-info -> continue -> finish path the
// functional suite uses (see tests/cart/checkout.spec.ts), scanning each
// page in its realistic, populated state rather than an empty skeleton.
async function reachCheckoutStepOne(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  const cartPage = new CartPage(page);
  await cartPage.checkoutButton.click();
  await expect(page).toHaveURL(/.*checkout-step-one\.html/);
}

async function reachCheckoutStepTwo(page: import('@playwright/test').Page): Promise<void> {
  await reachCheckoutStepOne(page);

  const stepOnePage = new CheckoutStepOnePage(page);
  await stepOnePage.fillInfo('John', 'Doe', '12345');
  await stepOnePage.continueButton.click();
  await expect(page).toHaveURL(/.*checkout-step-two\.html/);
}

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  test('checkout step one has no WCAG 2.0 A/AA violations', async ({ page }) => {
    await reachCheckoutStepOne(page);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('checkout step two has no WCAG 2.0 A/AA violations', async ({ page }) => {
    await reachCheckoutStepTwo(page);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('checkout complete page has no WCAG 2.0 A/AA violations', async ({ page }) => {
    await reachCheckoutStepTwo(page);

    const stepTwoPage = new CheckoutStepTwoPage(page);
    await stepTwoPage.finishButton.click();
    await expect(page).toHaveURL(/.*checkout-complete\.html/);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
