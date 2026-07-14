import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.use({ storageState: '.auth/visual_user.json' });

// Bug check: for the "visual_user" test account, the shopping cart icon
// in the header renders in the wrong position. For standard_user it sits
// at roughly {x: 1220, y: 10}; for visual_user it renders shifted left
// and down, around {x: 1034, y: 39}. Verified live across repeat loads —
// the icon's malposition is consistent (unlike the price bug below).
test('visual_user: cart icon renders in the wrong position', async ({ page }) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  const cartBox = await inventoryPage.cartIcon.boundingBox();

  expect(cartBox).not.toBeNull();
  // Correct position (matches standard_user) is x: 1220, y: 10. The bug
  // shifts it well away from that, so assert it lands outside a small
  // tolerance of the correct spot.
  expect(Math.abs(cartBox!.x - 1220)).toBeGreaterThan(50);
  expect(Math.abs(cartBox!.y - 10)).toBeGreaterThan(10);
});

// Bug check: for the "visual_user" test account, item prices on the
// inventory page are randomized on every page load instead of showing
// the real prices. Verified live across repeat loads — the same product
// shows a different, incorrect price each time. This test confirms the
// displayed prices don't match the known-correct catalog prices.
test('visual_user: inventory prices do not match the real catalog prices', async ({ page }) => {
  const correctPrices: Record<string, string> = {
    'Sauce Labs Backpack': '$29.99',
    'Sauce Labs Bike Light': '$9.99',
    'Sauce Labs Bolt T-Shirt': '$15.99',
    'Sauce Labs Fleece Jacket': '$49.99',
    'Sauce Labs Onesie': '$7.99',
    'Test.allTheThings() T-Shirt (Red)': '$15.99',
  };

  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);

  let mismatchCount = 0;
  for (const [name, correctPrice] of Object.entries(correctPrices)) {
    const displayedPrice = await inventoryPage.getItemPrice(name).textContent();
    if (displayedPrice?.trim() !== correctPrice) {
      mismatchCount++;
    }
  }

  expect(mismatchCount).toBeGreaterThan(0);
});
