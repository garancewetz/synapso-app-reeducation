import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { TEST_USER } from './helpers/test-constants';

test.describe('Connexion', () => {
  test('se connecte et accède au tableau de bord', async ({ page }) => {
    const authHelper = new AuthHelper(page);

    await authHelper.login(TEST_USER.username, TEST_USER.password);

    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
    await expect(page.getByText(/Corps|Journal|Parcours/).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('se déconnecte et revient à l\'écran de connexion', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.login(TEST_USER.username, TEST_USER.password);

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Se déconnecter' }).click();

    await expect(page.locator('form').getByRole('button', { name: 'Se connecter' })).toBeVisible({
      timeout: 10000,
    });
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  });
});
