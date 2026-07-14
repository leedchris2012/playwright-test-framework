import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutStepOnePage } from '../../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../../pages/CheckoutStepTwoPage';
import { CheckoutCompletePage } from '../../pages/CheckoutCompletePage';

async function checkoutBackpack(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

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
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

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

// Checks that going through checkout with an item carries the correct
// price all the way to the order summary step.
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
