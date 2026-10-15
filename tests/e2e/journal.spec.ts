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

  test('valide une entrée sans exercice et affiche le badge Validé', async ({ page }) => {
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');

    if (!page.url().includes('/journal')) {
      return;
    }

    const title = 'Entrée E2E à valider ' + Date.now();
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
    await noteCard.getByRole('button', { name: 'Valider' }).click();

    await expect(noteCard.getByText('Validé').first()).toBeVisible({ timeout: 5000 });
    await expect(
      noteCard.getByRole('button', { name: /Annuler la validation pour aujourd'hui/ })
    ).toBeVisible();
  });

  test('valide une entrée avec exercices liés et marque les exercices comme faits', async ({ page }) => {
    await page.goto('/exercice/add');
    await page.waitForLoadState('networkidle');
    if (!page.url().includes('/exercice/add')) {
      return;
    }
    const exerciceName = 'Exercice E2E journal ' + Date.now();
    await page.getByPlaceholder('Ex: Montée de genoux').fill(exerciceName);
    await page.getByPlaceholder('Décrivez comment réaliser l\'exercice...').fill('Pour test journal');
    await page.getByRole('button', { name: 'Suivant →' }).click();
    await page.getByRole('button', { name: 'Haut' }).click();
    await page.getByRole('button', { name: 'Suivant →' }).click();
    await page.getByPlaceholder('Ex: 10').fill('8');
    await page.getByPlaceholder('Ex: 3', { exact: true }).fill('2');
    await page.getByRole('button', { name: "Créer l'exercice" }).click();
    await expect(page).not.toHaveURL(/\/exercice\/add/);

    await page.goto('/journal');
    await page.waitForLoadState('networkidle');
    if (!page.url().includes('/journal')) {
      return;
    }

    const title = 'Entrée E2E parcours ' + Date.now();
    await page.getByRole('button', { name: 'Ajouter une note' }).click();
    await page.getByPlaceholder('Titre de la note').fill(title);
    await page.getByRole('button', { name: 'Terminer' }).click();

    await expect(page).toHaveURL(/\/journal/, { timeout: 10000 });
    // Notes are compact rows: open it to get the full card
    await page.getByRole('button', { name: `Ouvrir la note ${title}` }).click();
    const noteCard = page.getByRole('article', { name: `Entrée : ${title}` });
    await expect(noteCard).toBeVisible({ timeout: 10000 });
    await noteCard.scrollIntoViewIfNeeded();
    await noteCard.getByRole('button', { name: 'Ouvrir les actions' }).click();
    await noteCard.getByRole('button', { name: 'Lier des exercices' }).click();
    const pickerDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'Lier des exercices' }) });
    await pickerDialog.waitFor({ state: 'visible', timeout: 5000 });
    await page.getByRole('tab', { name: 'Haut' }).click();
    await page.getByRole('button', { name: exerciceName }).click();
    const putResponsePromise = page.waitForResponse(
      (res) => /\/api\/journal\/notes\/\d+$/.test(res.url()) && res.request().method() === 'PUT',
      { timeout: 20000 }
    );
    await pickerDialog.getByRole('button', { name: 'Valider', exact: true }).click();
    await putResponsePromise;

    await expect(noteCard.getByText(exerciceName)).toBeVisible({ timeout: 5000 });
    const validateButton = noteCard.getByRole('button', { name: 'Valider' });
    await validateButton.waitFor({ state: 'visible', timeout: 5000 });
    await validateButton.click();

    await expect(noteCard.getByText('Validé').first()).toBeVisible({ timeout: 5000 });
    await expect(noteCard.getByLabel('Complété').first()).toBeVisible({ timeout: 5000 });

    await noteCard
      .getByRole('button', { name: /Annuler la validation pour aujourd'hui/ })
      .click();
    await expect(
      noteCard.getByRole('button', { name: /Valider pour aujourd'hui/ })
    ).toBeVisible({ timeout: 5000 });
    await expect(noteCard.getByText('Validé')).toHaveCount(0);
    await expect(noteCard.getByLabel('Complété')).toHaveCount(0);
  });

  test.skip('clic sur un exercice lié ouvre la page catégorie avec hash et scroll vers la carte', async () => {
    // Les exercices liés dans le journal sont de nouveau cliquables
    // et renvoient vers la page catégorie avec hash (#exercice-{id}),
    // mais ce scénario n'est pas encore rejoué en E2E.
  });
});
