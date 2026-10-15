import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { TEST_USER } from './helpers/test-constants';

test.describe('Archivage', () => {
  test.beforeEach(async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.login(TEST_USER.username, TEST_USER.password);
  });

  test('archive un exercice puis le voit sur la page archivés', async ({ page }) => {
    await page.goto('/exercices/upper_body');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('.exercise-row').first();
    await firstCard.waitFor({ state: 'visible', timeout: 15000 });
    const exerciceName = await firstCard.locator('.exercise-row-name').first().textContent();
    if (!exerciceName?.trim()) {
      throw new Error('Aucun exercice trouvé sur la page');
    }

    await firstCard.getByRole('button', { name: /^Actions pour / }).click();
    await page.waitForTimeout(500);

    const archiveButton = firstCard.getByRole('button', { name: 'Archiver' });
    await archiveButton.waitFor({ state: 'visible', timeout: 5000 });
    const archiveResponse = page.waitForResponse(
      (res) => res.url().includes('/api/exercices/') && res.url().includes('/archive') && res.request().method() === 'PATCH',
      { timeout: 15000 }
    );
    await archiveButton.click();
    await archiveResponse;

    await page.goto('/exercices/archived');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(exerciceName.trim()).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('désarchive un exercice depuis la page archivés', async ({ page }) => {
    await page.goto('/exercices/archived');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('.exercise-card').first();
    const isVisible = await firstCard.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      return;
    }

    const exerciceName = await firstCard.locator('h3').first().textContent();
    if (!exerciceName?.trim()) {
      return;
    }

    await firstCard.getByRole('button', { name: 'Ouvrir les actions' }).click();
    await page.waitForTimeout(500);

    const unarchiveButton = firstCard.getByRole('button', { name: 'Désarchiver' });
    await unarchiveButton.waitFor({ state: 'visible', timeout: 5000 });
    const unarchiveResponse = page.waitForResponse(
      (res) => res.url().includes('/api/exercices/') && res.url().includes('/archive') && res.request().method() === 'PATCH',
      { timeout: 15000 }
    );
    await unarchiveButton.click();
    await unarchiveResponse;

    await page.goto('/exercices/upper_body');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(exerciceName.trim()).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
