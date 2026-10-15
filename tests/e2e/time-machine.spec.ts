import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { TimeMachineHelper } from './helpers/time-machine';
import { TEST_USER } from './helpers/test-constants';
import { format, subDays, startOfDay } from 'date-fns';

/**
 * Tests E2E pour le mode sablier (time machine)
 * 
 * Ces tests vérifient que :
 * - Le mode sablier s'active correctement
 * - Les gauges se mettent à jour selon la date sélectionnée
 * - Les exercices affichent leur état pour la date sélectionnée
 * - La navigation entre dates fonctionne
 * - Le retour à aujourd'hui fonctionne
 */
test.describe('Mode Sablier (Time Machine)', () => {
  let authHelper: AuthHelper;
  let timeMachineHelper: TimeMachineHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    timeMachineHelper = new TimeMachineHelper(page);

    // Se connecter avec un utilisateur de test
    await authHelper.login(TEST_USER.username, TEST_USER.password);
    
    // Attendre un peu pour que la page se charge complètement
    await page.waitForTimeout(1000);
    
    // Vérifier qu'on est bien connecté
    // Vérifier que l'URL est bien la page d'accueil
    const url = page.url();
    expect(new URL(url).pathname).toBe('/');
    
    // Vérifier la présence d'éléments du dashboard (plus flexible)
    const hasDashboard = await Promise.race([
      page.locator('text=Corps').first().isVisible().then(() => true),
      page.locator('text=Journal').first().isVisible().then(() => true),
      page.locator('text=Parcours').first().isVisible().then(() => true),
      page.locator('[role="progressbar"]').first().isVisible().then(() => true),
      page.waitForTimeout(2000).then(() => false)
    ]);
    
    expect(hasDashboard).toBeTruthy();
  });

  test('devrait activer le mode sablier en cliquant sur un jour passé dans la heatmap', async ({ page }) => {
    // Aller à la page historique
    await timeMachineHelper.goToHistory();

    // Attendre que la heatmap soit chargée
    await page.waitForSelector('[role="grid"], .grid', { timeout: 10000 });

    // Cliquer sur un jour passé (hier)
    await timeMachineHelper.clickDayInHeatmap(1);

    // Vérifier que la modal s'ouvre ou que le mode sablier s'active
    const modalVisible = await page.locator('[role="dialog"]:not(#main-menu)').isVisible({ timeout: 2000 }).catch(() => false);
    const timeMachineActive = await timeMachineHelper.isTimeMachineModeActive();

    expect(modalVisible || timeMachineActive).toBeTruthy();
  });

  test('ouvre la modal détail du jour au clic sur la heatmap avec date en titre et contenu', async ({ page }) => {
    await timeMachineHelper.goToHistory();
    await page.waitForSelector('[role="grid"], .grid', { timeout: 10000 });

    await timeMachineHelper.clickDayInHeatmap(1);

    const modal = page.locator('[role="dialog"]:not(#main-menu)');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const heading = modal.getByRole('heading', { level: 2 });
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText?.trim().length).toBeGreaterThan(0);

    const hasExercicesSection = await modal.getByText('Exercices faits').isVisible({ timeout: 2000 }).catch(() => false);
    const hasProgressSection = await modal.getByText('Progrès').isVisible({ timeout: 2000 }).catch(() => false);
    const hasEmptyMessage = await modal.getByText(/Pas d’exercice ce jour-là|Jour de repos/).isVisible({ timeout: 2000 }).catch(() => false);
    const hasAddButton = await modal.getByRole('button', { name: /Ajouter des exercices pour ce jour|Modifier les exercices pour ce jour/ }).isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasExercicesSection || hasProgressSection || hasEmptyMessage || hasAddButton).toBeTruthy();
  });

  test('devrait afficher la bannière du mode sablier après activation', async ({ page }) => {
    // Aller à la page historique
    await timeMachineHelper.goToHistory();
    await page.waitForSelector('[role="grid"], .grid', { timeout: 10000 });
    
    // Activer le mode sablier pour hier
    await timeMachineHelper.activateTimeMachineMode(1);
    
    // Vérifier que la bannière est visible
    const banner = page.getByTestId('time-machine-banner').first();
    await expect(banner).toBeVisible({ timeout: 5000 });
    
    // Vérifier que la bannière contient la date
    const bannerText = await banner.textContent();
    expect(bannerText).toContain('Tu es sur le');
  });

  test('devrait mettre à jour les compteurs des zones selon la date sélectionnée', async ({ page }) => {
    // Home zone list: « Haut du corps : 1 sur 16 faits » for each zone.
    const zoneCounters = page.getByRole('navigation', { name: 'Zones du corps' }).getByRole('link', { name: / : \d+ sur \d+ faits$/ });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(zoneCounters.first()).toBeVisible({ timeout: 10000 });

    // Aller à la page historique et activer le mode sablier pour hier
    await timeMachineHelper.goToHistory();
    await page.waitForSelector('[role="grid"], .grid', { timeout: 10000 });
    await timeMachineHelper.activateTimeMachineMode(1);
    await page.waitForSelector('[data-testid="time-machine-banner"]', { timeout: 5000 });

    await page.goto('/?date=' + format(subDays(new Date(), 1), 'yyyy-MM-dd'));
    await page.waitForLoadState('networkidle');

    // Les compteurs restent présents et cohérents (« X sur Y », X ≤ Y) pour hier
    await expect(zoneCounters.first()).toBeVisible({ timeout: 10000 });
    for (const label of await zoneCounters.evaluateAll((links) => links.map((l) => l.getAttribute('aria-label') ?? ''))) {
      const [, done, total] = label.match(/(\d+) sur (\d+)/) ?? [];
      expect(Number(done)).toBeLessThanOrEqual(Number(total));
    }
  });

  test('devrait afficher la date sélectionnée dans la carte d\'accueil', async ({ page }) => {
    // Aller à la page historique et activer le mode sablier pour hier
    await timeMachineHelper.goToHistory();
    await page.waitForSelector('[role="grid"], .grid', { timeout: 10000 });
    await timeMachineHelper.activateTimeMachineMode(1);

    await page.waitForSelector('[data-testid="time-machine-banner"]', { timeout: 5000 });

    const yesterdayDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    await page.goto(`/?date=${yesterdayDate}`);
    await page.waitForLoadState('networkidle');

    if (await timeMachineHelper.isTimeMachineModeActive()) {
      // « Mode sablier - Mercredi 14 octobre » at the top of the welcome card
      const label = page.getByText(/^Mode sablier - (Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche) \d+ \p{L}+$/u).first();
      await expect(label).toBeVisible({ timeout: 5000 });
    }
  });

  test('devrait afficher les exercices avec leur état pour la date sélectionnée', async ({ page }) => {
    // Aller à une page de catégorie
    await page.goto('/exercices/upper_body');
    await page.waitForLoadState('networkidle');
    
    // Capturer l'état initial des exercices (pour aujourd'hui)
    await page.locator('[data-testid="exercice-card"], .exercice-card').all();
    await page.locator('button:has-text("Fait"), button:has-text("Fait aujourd\'hui")').count();
    
    // Aller à la page historique et activer le mode sablier pour hier
    await timeMachineHelper.goToHistory();
    await page.waitForSelector('[role="grid"], .grid', { timeout: 10000 });
    await timeMachineHelper.activateTimeMachineMode(1);
    
    // Attendre que le mode sablier soit actif
    await page.waitForSelector('[data-testid="time-machine-banner"]', { timeout: 5000 });
    
    // Retourner à la page de catégorie avec la date dans l'URL
    const yesterdayDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    await page.goto(`/exercices/upper_body?date=${yesterdayDate}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    if (await timeMachineHelper.isTimeMachineModeActive()) {
      const cards = page.locator('.exercise-row');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test('devrait permettre de revenir à aujourd\'hui depuis le mode sablier', async ({ page }) => {
    // Aller à la page historique
    await timeMachineHelper.goToHistory();
    await page.waitForSelector('[role="grid"], .grid', { timeout: 10000 });
    
    // Activer le mode sablier pour hier
    await timeMachineHelper.activateTimeMachineMode(1);
    
    // Vérifier que le mode sablier est actif
    await expect(page.locator('[data-testid="time-machine-banner"]').first()).toBeVisible({ timeout: 5000 });
    
    // Cliquer sur le bouton "Revenir à aujourd'hui"
    await timeMachineHelper.returnToToday();
    
    // Attendre que le mode sablier se désactive
    await page.waitForTimeout(1000);
    
    // Vérifier que la bannière n'est plus visible
    const bannerStillVisible = await page.locator('[data-testid="time-machine-banner"]').isVisible({ timeout: 2000 }).catch(() => false);
    expect(bannerStillVisible).toBeFalsy();
  });

  test('devrait mettre à jour l\'URL avec le paramètre date en mode sablier', async ({ page }) => {
    // Aller à la page historique
    await timeMachineHelper.goToHistory();
    await page.waitForSelector('[role="grid"], .grid', { timeout: 10000 });
    
    // Activer le mode sablier pour hier
    await timeMachineHelper.activateTimeMachineMode(1);
    
    // Attendre que le mode sablier soit actif
    await page.waitForSelector('[data-testid="time-machine-banner"]', { timeout: 5000 });
    
    // Vérifier que l'URL contient le paramètre date
    const url = page.url();
    const yesterdayDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    // L'URL devrait contenir ?date= ou &date=
    expect(url).toMatch(/[?&]date=/);
    
    // Extraire la date de l'URL
    const urlMatch = url.match(/[?&]date=(\d{4}-\d{2}-\d{2})/);
    if (urlMatch) {
      expect(urlMatch[1]).toBe(yesterdayDate);
    }
  });

  test('devrait préserver le paramètre date lors de la navigation', async ({ page }) => {
    const yesterdayDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Aller à la page d'accueil avec le paramètre date
    await page.goto(`/?date=${yesterdayDate}`);
    await page.waitForLoadState('networkidle');
    
    // Vérifier que le mode sablier est actif
    await expect(page.locator('[data-testid="time-machine-banner"]').first()).toBeVisible({ timeout: 5000 });
    
    // Naviguer vers une page de catégorie
    const categoryLink = page.locator('a[href*="upper_body"]').first();
    await categoryLink.click({ timeout: 5000 }).catch(() =>
      page.goto(`/exercices/upper_body?date=${yesterdayDate}`)
    );
    
    await page.waitForLoadState('networkidle');
    
    // Vérifier que l'URL contient toujours le paramètre date
    const url = page.url();
    expect(url).toContain(`date=${yesterdayDate}`);
    
    // Vérifier que le mode sablier est toujours actif
    const bannerStillVisible = await page.locator('[data-testid="time-machine-banner"]').isVisible({ timeout: 2000 }).catch(() => false);
    expect(bannerStillVisible).toBeTruthy();
  });

  test('devrait préserver le paramètre date lors de la navigation dans le journal', async ({ page }) => {
    const yesterdayDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    await page.goto(`/journal/add?date=${yesterdayDate}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="time-machine-banner"]').first()).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('/journal/add');
    expect(page.url()).toContain(`date=${yesterdayDate}`);

    const backToJournal = page.getByRole('link', { name: /Retour : Notes/ });
    await expect(backToJournal).toBeVisible({ timeout: 10000 });
    await backToJournal.click();

    await expect(page).toHaveURL(new RegExp(`\\/journal\\/?\\?.*date=${yesterdayDate}`), { timeout: 10000 });
  });

  test('devrait limiter le mode sablier à 28 jours en arrière', async ({ page }) => {
    const tooOldDate = subDays(new Date(), 29);
    const tooOldDateKey = format(startOfDay(tooOldDate), 'yyyy-MM-dd');

    await page.goto(`/?date=${tooOldDateKey}`);
    await page.waitForLoadState('networkidle');

    // L'app invalide la date et fait router.replace pour retirer le param : attendre que l'URL soit corrigée
    await expect(page).not.toHaveURL(new RegExp(`date=${tooOldDateKey}`), { timeout: 10000 });

    const timeMachineActive = await timeMachineHelper.isTimeMachineModeActive();
    expect(timeMachineActive).toBe(false);
  });
});
