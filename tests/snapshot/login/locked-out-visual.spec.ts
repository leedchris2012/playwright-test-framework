import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';

// Visual check: takes a screenshot of the login page after attempting to
// log in with locked_out_user, and compares it pixel-for-pixel against a
// saved reference image to catch unexpected visual changes to the error state.
test('login page after locked_out_user attempt matches baseline', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('locked_out_user', 'secret_sauce');

  await expect(loginPage.errorMessage).toBeVisible();
  await expect(page).toHaveScreenshot('login-locked-out-user.png', {
    fullPage: true,
  });
});
