import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutStepOnePage } from '../../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../../pages/CheckoutStepTwoPage';

// Saucedemo has no product/cart/checkout API to mock — the catalog is
// baked into the JS bundle and login is checked client-side. The only
// real fetch() calls on the site are third-party telemetry beacons to
// events.backtrace.io. This test asks a more realistic question: if that
// third-party dependency is unreachable, does the core purchase flow
// still work, or does the app quietly depend on it?
test('core purchase flow completes even when backtrace.io telemetry is unreachable', async ({
  page,
}) => {
  await page.route('**://events.backtrace.io/**', (route) => route.abort('failed'));

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');
  await expect(page).toHaveURL(/.*inventory\.html/);

  const inventoryPage = new InventoryPage(page);
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
  await stepTwoPage.finishButton.click();
  await expect(page).toHaveURL(/.*checkout-complete\.html/);
});
