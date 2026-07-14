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
