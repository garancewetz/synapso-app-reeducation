import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { TEST_USER } from './helpers/test-constants';

test.describe('Journal', () => {
  test.beforeEach(async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.login(TEST_USER.username, TEST_USER.password);
  });

  test('affiche la page journal ou redirige si pas d\'accès', async ({ page }) => {
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('/journal')) {
      await expect(page.getByRole('heading', { name: /Notes/ })).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('crée une entrée et la voit dans la liste', async ({ page }) => {
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');

    if (!page.url().includes('/journal')) {
      return;
    }

    await page.getByRole('button', { name: 'Ajouter une note' }).click();

    const title = 'Entrée E2E ' + Date.now();
    await page.getByPlaceholder('Titre de la note').fill(title);
    await page.getByRole('button', { name: 'Terminer' }).click();

    await expect(page).toHaveURL(/\/journal/, { timeout: 10000 });
    await page.waitForResponse(
      (res) => res.url().includes('/api/journal/notes') && res.request().method() === 'GET',
      { timeout: 15000 }
    );
    // Notes are compact rows: open it to get the full card
    await page.getByRole('button', { name: `Ouvrir la note ${title}` }).click();
    const createdNoteCard = page.getByRole('article', { name: `Entrée : ${title}` });
    await expect(createdNoteCard).toBeVisible({ timeout: 15000 });
  });

  test('édite une entrée et vérifie que la liste se met à jour', async ({ page }) => {
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');

    if (!page.url().includes('/journal')) {
      return;
    }

    const title = 'Entrée E2E à éditer ' + Date.now();
    await page.getByRole('button', { name: 'Ajouter une note' }).click();
    await page.getByPlaceholder('Titre de la note').fill(title);
    await page.getByRole('button', { name: 'Terminer' }).click();

    await expect(page).toHaveURL(/\/journal/, { timeout: 10000 });
    await page.waitForResponse(
      (res) => res.url().includes('/api/journal/notes') && res.request().method() === 'GET',
      { timeout: 15000 }
    );
    // Notes are compact rows: open it to get the full card
    await page.getByRole('button', { name: `Ouvrir la note ${title}` }).click();
    const noteCard = page.getByRole('article', { name: `Entrée : ${title}` });
    await expect(noteCard).toBeVisible({ timeout: 15000 });
    await noteCard.scrollIntoViewIfNeeded();
    const newTitle = 'Entrée E2E éditée ' + Date.now();
    await noteCard.getByPlaceholder('Titre').clear();
    await noteCard.getByPlaceholder('Titre').fill(newTitle);
    await expect(noteCard.getByText('Enregistrée')).toBeVisible({ timeout: 5000 });
    const updatedNoteCard = page.getByRole('article', { name: `Entrée : ${newTitle}` });
    await expect(updatedNoteCard).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('article', { name: `Entrée : ${title}` })).toHaveCount(0);
  });
});
