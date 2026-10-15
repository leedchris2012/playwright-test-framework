import { test, expect } from '../../fixtures';
import { attachWcagCoverage } from '../../utils/wcagCoverage';

// Scans the login page, unauthenticated, against the WCAG 2.0 A/AA
// rule set — this is the one page every user hits before any storage
// state applies.
test('login page has no WCAG 2.0 A/AA violations', async ({ loginPage, makeAxeBuilder }, testInfo) => {
  await loginPage.goto();

  const results = await test.step('axe scan: WCAG 2.0 A/AA', () =>
    makeAxeBuilder().analyze()
  );
  await attachWcagCoverage(testInfo, results);

  expect(results.violations).toEqual([]);
});

// WCAG 2.4.3 Focus Order (A): keyboard users must reach the form controls in the
// same order they appear on screen.
test('login form focus order follows the visual order (WCAG 2.4.3)', async ({ page, loginPage, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit Tab skips buttons by default (Safari setting); not a page defect');
  await loginPage.goto();

  for (const control of [loginPage.usernameInput, loginPage.passwordInput, loginPage.loginButton]) {
    await page.keyboard.press('Tab');
    await expect(control).toBeFocused();
  }
});
