// ============================================================================
// CONSTANTES POUR LA PAGE HISTORIQUE
// ============================================================================

// Options de filtre de période
export type PeriodFilter = 'week' | 'month' | 'total';

// Seuils pour les emojis de récompense
export const REWARD_EMOJIS = [
  { threshold: 50, emoji: '👑' },
  { threshold: 25, emoji: '🌟' },
  { threshold: 10, emoji: '🎯' },
] as const;

// Nombre de jours à afficher dans la roadmap (aperçu)
export const ROADMAP_PREVIEW_DAYS = 7;

// Nombre maximum de bodyparts à afficher dans le graphique des zones travaillées
export const MAX_BODYPARTS_IN_CHART = 6;

// Nombre maximum de jours en arrière pour le mode sablier (Time Machine)
// Limité à 28 jours pour garantir que les données sont toujours disponibles
// (useHistory charge 40 jours par défaut, donc 28 jours max = marge de sécurité)
export const MAX_TIME_MACHINE_DAYS = 28;
