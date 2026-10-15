import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { TEST_USER } from './helpers/test-constants';

test.describe('Exercices', () => {
  test.beforeEach(async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.login(TEST_USER.username, TEST_USER.password);
  });

  test('crée un nouvel exercice', async ({ page }) => {
    await page.goto('/exercice/add');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Ajouter un exercice' })).toBeVisible({
      timeout: 10000,
    });

    // Nom et description
    await page.getByPlaceholder('Ex: Montée de genoux').fill('Exercice E2E créé');
    await page.getByPlaceholder('Décrivez comment réaliser l\'exercice...').fill('Description du test');

    // Catégorie et parties du corps
    await page.getByRole('button', { name: 'Haut' }).click();
    await page.getByRole('button', { name: 'Bras' }).click();

    // Paramètres workout
    await page.getByPlaceholder('Ex: 10').fill('12');
    await page.getByPlaceholder('Ex: 3', { exact: true }).fill('2');
    await page.getByPlaceholder('Ex: 30 secondes').fill('45 secondes');

    await page.getByRole('button', { name: "Créer l'exercice" }).click();

    await expect(page).not.toHaveURL(/\/exercice\/add/);
    await page.goto('/exercices/upper_body');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Exercice E2E créé').first()).toBeVisible({ timeout: 10000 });
  });

  test('modifie un exercice et vérifie que chaque champ se met à jour', async ({ page }) => {
    await page.goto('/exercices/upper_body');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('.exercise-row').first();
    await firstCard.waitFor({ state: 'visible', timeout: 15000 });
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.getByRole('button', { name: /^Actions pour / }).click();
    const modifierButton = firstCard.getByRole('button', { name: 'Modifier' });
    await modifierButton.waitFor({ state: 'visible', timeout: 5000 });

    await Promise.all([
      page.waitForURL(/\/exercice\/edit\/\d+/, { timeout: 15000 }),
      modifierButton.click(),
    ]);
    await expect(page.getByRole('heading', { name: "Modifier l'exercice" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByPlaceholder('Ex: Montée de genoux')).not.toHaveValue('', {
      timeout: 10000,
    });

    const newName = 'Exercice E2E modifié';
    const newDescription = 'Description modifiée';
    const newComment = 'Conseil modifié';
    const newRepeat = '15';
    const newSeries = '4';
    const newDuration = '60 secondes';

    // Modifier nom, description, conseil
    await page.getByPlaceholder('Ex: Montée de genoux').clear();
    await page.getByPlaceholder('Ex: Montée de genoux').fill(newName);
    await page.getByPlaceholder('Décrivez comment réaliser l\'exercice...').clear();
    await page.getByPlaceholder('Décrivez comment réaliser l\'exercice...').fill(newDescription);
    await page.getByPlaceholder('Ajoutez un conseil ou une remarque...').clear();
    await page.getByPlaceholder('Ajoutez un conseil ou une remarque...').fill(newComment);

    // Modifier catégorie et parties du corps
    await page.getByRole('button', { name: 'Tronc' }).click();
    await page.getByRole('button', { name: 'Dos' }).click();

    // Modifier paramètres workout et enregistrer
    await page.getByPlaceholder('Ex: 10').clear();
    await page.getByPlaceholder('Ex: 10').fill(newRepeat);
    await page.getByPlaceholder('Ex: 3', { exact: true }).clear();
    await page.getByPlaceholder('Ex: 3', { exact: true }).fill(newSeries);
    await page.getByPlaceholder('Ex: 30 secondes').clear();
    await page.getByPlaceholder('Ex: 30 secondes').fill(newDuration);

    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();

    await expect(page).not.toHaveURL(/\/exercice\/edit/);
    await page.goto('/exercices/core');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(newName).first()).toBeVisible({ timeout: 10000 });

    // Vérification : rouvrir l'exercice et vérifier les champs
    const cardWithNewName = page.locator('.exercise-row').filter({ hasText: newName }).first();
    await cardWithNewName.scrollIntoViewIfNeeded();
    await cardWithNewName.getByRole('button', { name: /^Actions pour / }).click();
    const modifierBtn2 = cardWithNewName.getByRole('button', { name: 'Modifier' });
    await modifierBtn2.waitFor({ state: 'visible', timeout: 5000 });

    await Promise.all([
      page.waitForURL(/\/exercice\/edit\/\d+/, { timeout: 15000 }),
      modifierBtn2.click(),
    ]);

    // Vérifier les textes
    await expect(page.getByPlaceholder('Ex: Montée de genoux')).toHaveValue(newName);
    await expect(page.getByPlaceholder('Décrivez comment réaliser l\'exercice...')).toHaveValue(
      newDescription
    );
    await expect(page.getByPlaceholder('Ajoutez un conseil ou une remarque...')).toHaveValue(
      newComment
    );

    // Vérifier la catégorie
    await expect(page.getByRole('button', { name: 'Tronc' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // Vérifier le workout
    await expect(page.getByPlaceholder('Ex: 10')).toHaveValue(newRepeat);
    await expect(page.getByPlaceholder('Ex: 3', { exact: true })).toHaveValue(newSeries);
    await expect(page.getByPlaceholder('Ex: 30 secondes')).toHaveValue(newDuration);
  });

  test('marque un exercice comme fait aujourd\'hui et met à jour l\'affichage', async ({ page }) => {
    await page.goto('/exercices/upper_body');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('.exercise-row').first();
    await firstCard.waitFor({ state: 'visible', timeout: 15000 });
    await firstCard.scrollIntoViewIfNeeded();

    // Compact row: round check button labelled "Marquer <nom> comme fait" / "Démarquer <nom>"
    const completeButton = firstCard.getByRole('button', { name: /^Marquer .+ comme fait$|^Démarquer / }).first();
    await completeButton.waitFor({ state: 'visible', timeout: 10000 });

    const completeResponse = page.waitForResponse(
      (res) =>
        /\/api\/exercices\/\d+\/complete/.test(res.url()) &&
        res.request().method() === 'PATCH' &&
        res.status() === 200,
      { timeout: 15000 }
    );
    await completeButton.click();
    await completeResponse;

    await expect(completeButton).toHaveAttribute(
      'aria-label',
      /^Démarquer |^Marquer .+ comme fait$/,
      { timeout: 10000 }
    );
  });

  test('supprime un exercice', async ({ page }) => {
    // Créer d'abord un exercice à supprimer
    await page.goto('/exercice/add');
    await page.waitForLoadState('networkidle');

    const nameToDelete = 'Exercice E2E à supprimer';
    await page.getByPlaceholder('Ex: Montée de genoux').fill(nameToDelete);
    await page.getByRole('button', { name: "Créer l'exercice" }).click();

    await expect(page).not.toHaveURL(/\/exercice\/add/);
    await page.goto('/exercices/upper_body');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(nameToDelete).first()).toBeVisible({ timeout: 10000 });

    // Ouvrir la page d'édition
    const cardToDelete = page.locator('.exercise-row').filter({ hasText: nameToDelete }).first();
    await cardToDelete.scrollIntoViewIfNeeded();
    await cardToDelete.getByRole('button', { name: /^Actions pour / }).click();
    const modifierBtn = cardToDelete.getByRole('button', { name: 'Modifier' });
    await modifierBtn.waitFor({ state: 'visible', timeout: 5000 });

    await Promise.all([
      page.waitForURL(/\/exercice\/edit\/\d+/, { timeout: 15000 }),
      modifierBtn.click(),
    ]);

    await page.getByRole('button', { name: "Supprimer l'exercice" }).click();
    await page
      .getByRole('button', { name: '⚠️ Confirmer la suppression' })
      .waitFor({ state: 'visible', timeout: 5000 });
    await page.getByRole('button', { name: '⚠️ Confirmer la suppression' }).click();

    await expect(page).not.toHaveURL(/\/exercice\/edit/);
    await page.goto('/exercices/upper_body');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(nameToDelete)).toHaveCount(0, { timeout: 15000 });
  });
});
