import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';

// Visual check: takes a screenshot of the Products page for problem_user,
// and compares it pixel-for-pixel against a saved reference image. Locks
// in the known broken-image bug (every product tile shows the same
// broken picture instead of its own) so a fix or worsening shows up as
// a diff.
test('problem_user inventory page matches baseline (same broken image on every product)', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('problem_user', 'secret_sauce');

  await expect(page).toHaveScreenshot('problem-user-inventory.png', {
    fullPage: true,
  });
});
