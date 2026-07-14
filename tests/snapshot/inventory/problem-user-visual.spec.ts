import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/problem_user.json' });

// Visual check: takes a screenshot of the Products page for problem_user,
// and compares it pixel-for-pixel against a saved reference image. Locks
// in the known broken-image bug (every product tile shows the same
// broken picture instead of its own) so a fix or worsening shows up as
// a diff.
test('problem_user inventory page matches baseline (same broken image on every product)', async ({
  page,
}) => {
  await page.goto('/inventory.html');

  await expect(page).toHaveScreenshot('problem-user-inventory.png', {
    fullPage: true,
  });
});
