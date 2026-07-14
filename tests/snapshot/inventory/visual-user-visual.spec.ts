import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';

// Visual check: takes a screenshot of the Products page for visual_user,
// and compares it pixel-for-pixel against a saved reference image. Locks
// in the known cart-icon-misplacement bug so a fix (or worsening) shows
// up as a diff. Prices are hidden via CSS (rather than Playwright's
// bounding-box mask) because visual_user's price bug re-randomizes the
// displayed values, including their digit count, on every page load — a
// bounding-box mask shifts size with the text and leaves inconsistent
// slivers visible, but hiding the text color removes it without
// affecting layout.
test('visual_user inventory page matches baseline (misplaced cart icon)', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('visual_user', 'secret_sauce');

  await page.addStyleTag({
    content: '.inventory_item_price { color: transparent !important; }',
  });

  await expect(page).toHaveScreenshot('visual-user-inventory.png', {
    fullPage: true,
  });
});
