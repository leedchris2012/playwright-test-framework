import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test('homepage loads successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await expect(loginPage.logo).toBeVisible();
  await expect(page).toHaveTitle('Swag Labs');
});

test('logs in successfully with standard_user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login('standard_user', 'secret_sauce');

  await expect(page).toHaveURL(/.*inventory\.html/);
  await expect(page.locator('.title')).toHaveText('Products');
});

test('locked_out_user is blocked with an error message', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login('locked_out_user', 'secret_sauce');

  await expect(page).toHaveURL('https://www.saucedemo.com/');
  await expect(loginPage.errorMessage).toHaveText(
    'Epic sadface: Sorry, this user has been locked out.'
  );
});

test('invalid credentials show an error message', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login('bogus_user', 'wrong_password');

  await expect(page).toHaveURL('https://www.saucedemo.com/');
  await expect(loginPage.errorMessage).toHaveText(
    'Epic sadface: Username and password do not match any user in this service'
  );
});

test('submitting with empty fields shows a required-field error', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.loginButton.click();

  await expect(page).toHaveURL('https://www.saucedemo.com/');
  await expect(loginPage.errorMessage).toHaveText('Epic sadface: Username is required');
});

test('direct navigation to inventory.html without logging in is blocked', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await page.goto('/inventory.html');

  await expect(loginPage.loginButton).toBeVisible();
  await expect(loginPage.errorMessage).toHaveText(
    "Epic sadface: You can only access '/inventory.html' when you are logged in."
  );
});

test('logging out returns to the login page', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.logout();

  await expect(page).toHaveURL('https://www.saucedemo.com/');
  await expect(loginPage.loginButton).toBeVisible();
});
