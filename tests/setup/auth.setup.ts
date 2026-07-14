import { test as setup } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const accounts = ['standard_user', 'problem_user', 'visual_user', 'error_user'] as const;

for (const account of accounts) {
  setup(`authenticate as ${account}`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(account, 'secret_sauce');
    await page.waitForURL(/inventory\.html/);
    await page.context().storageState({ path: `.auth/${account}.json` });
  });
}
