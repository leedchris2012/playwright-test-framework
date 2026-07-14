import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutStepOnePage } from '../../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../../pages/CheckoutStepTwoPage';

test('completes checkout info steps with correct item total', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

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
