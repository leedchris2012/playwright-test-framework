import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

// Checks that the footer's social icons are visible, point to the right
// profile, and open in a new tab rather than navigating away from the app.
test('footer social icons link to the correct profiles and open in a new tab', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);

  const links: { locator: typeof inventoryPage.twitterLink; href: string }[] = [
    { locator: inventoryPage.twitterLink, href: 'https://twitter.com/saucelabs' },
    { locator: inventoryPage.facebookLink, href: 'https://www.facebook.com/saucelabs' },
    { locator: inventoryPage.linkedinLink, href: 'https://www.linkedin.com/company/sauce-labs/' },
  ];

  for (const { locator, href } of links) {
    await expect(locator).toBeVisible();
    await expect(locator).toHaveAttribute('href', href);
    await expect(locator).toHaveAttribute('target', '_blank');
  }
});
