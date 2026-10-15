import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.use({ storageState: '.auth/standard_user.json' });

// Checks that the footer's social icons are visible, point to the right
// profile, and open in a new tab rather than navigating away from the app.
test('footer social icons link to the correct profiles and open in a new tab', async ({ page }) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);

  const links: { locator: typeof inventoryPage.xLink; href: string }[] = [
    { locator: inventoryPage.xLink, href: 'https://x.com/saucelabs' },
    { locator: inventoryPage.facebookLink, href: 'https://www.facebook.com/saucelabs' },
    { locator: inventoryPage.linkedinLink, href: 'https://www.linkedin.com/company/sauce-labs/' },
  ];

  for (const { locator, href } of links) {
    await expect(locator).toBeVisible();
    await expect(locator).toHaveAttribute('href', href);
    await expect(locator).toHaveAttribute('target', '_blank');
  }
});
