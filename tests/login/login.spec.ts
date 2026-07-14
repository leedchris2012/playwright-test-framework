import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

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
