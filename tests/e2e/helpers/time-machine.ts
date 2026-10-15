import { Page } from '@playwright/test';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Helper pour le mode sablier (time machine) dans les tests E2E.
 * Permet d'aller sur l'historique, cliquer sur un jour dans la heatmap,
 * d'activer le mode sablier et de revenir à aujourd'hui.
 */
export class TimeMachineHelper {
  constructor(private page: Page) {}

  /**
   * Navigue vers la page historique.
   */
  async goToHistory(): Promise<void> {
    await this.page.goto('/historique');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clique sur un jour dans la heatmap (par nombre de jours en arrière).
   * Ouvre la modale de détail du jour.
   * @param daysAgo - Nombre de jours en arrière (1 = hier)
   */
  async clickDayInHeatmap(daysAgo: number): Promise<void> {
    const targetDate = subDays(new Date(), daysAgo);
    // Activity rounds are labelled "mercredi 14 octobre : 2 exercices"
    const dateLabel = format(targetDate, 'EEEE d MMMM', { locale: fr });
    const round = this.page.getByRole('button', { name: new RegExp(`^${dateLabel} :`) }).first();
    await round.waitFor({ state: 'visible', timeout: 10000 });
    await round.click();
  }

  /**
   * Active le mode sablier pour un jour passé : va sur l'historique,
   * clique sur le jour dans la heatmap, puis dans la modale clique sur
   * "Ajouter des exercices pour ce jour" ou "Modifier les exercices pour ce jour".
   * @param daysAgo - Nombre de jours en arrière (1 = hier)
   */
  async activateTimeMachineMode(daysAgo: number): Promise<void> {
    await this.goToHistory();
    await this.page.waitForSelector('[role="grid"], .grid', { timeout: 10000 });
    await this.clickDayInHeatmap(daysAgo);
    const modal = this.page.locator('[role="dialog"]:not(#main-menu)');
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    const activateButton = modal.getByRole('button', {
      name: /Ajouter des exercices pour ce jour|Modifier les exercices pour ce jour/,
    }).first();
    await activateButton.click({ timeout: 5000 });
    await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  /**
   * Indique si le mode sablier est actif (bannière visible).
   */
  async isTimeMachineModeActive(): Promise<boolean> {
    return this.page.locator('[data-testid="time-machine-banner"]').isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Clique sur "Revenir à aujourd'hui" dans la bannière du mode sablier.
   */
  async returnToToday(): Promise<void> {
    const button = this.page.getByRole('button', { name: /Revenir à aujourd'hui|Aujourd'hui/ }).first();
    await button.click();
  }
}
