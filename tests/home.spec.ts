import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test('homepage loads successfully', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await expect(homePage.logo).toBeVisible();
  await expect(page).toHaveTitle('Swag Labs');
});
