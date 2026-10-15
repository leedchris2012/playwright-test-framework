import { test as base, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

type Fixtures = {
    loginPage: LoginPage;
    inventoryPage: InventoryPage;
    makeAxeBuilder: () => AxeBuilder;
}

export const test = base.extend<Fixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    inventoryPage: async ({ page }, use) => {
        await use(new InventoryPage(page));
    },

    makeAxeBuilder: async ({ page }, use) => {
        await use(() => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']));
    },
});

export { expect };
