import type { ExerciceCategory, ExerciceStatusFilter } from '@/app/types/exercice';

// ============================================================================
// CONFIGURATION DE BASE - Source unique de vérité
// ============================================================================

// Configuration complète de chaque catégorie
// 🦵 Bleu = Bas du corps (ancrage, stabilité)
// 💪 Orange = Haut du corps (énergie, action)
// 🧘 Violet = Étirements (détente, souplesse)
// 🤸 Teal = Milieu (gainage, force centrale, stabilité)
// ✅ Vert Émeraude réservé pour validation
const CATEGORY_CONFIG: Record<ExerciceCategory, {
  color: keyof typeof TAILWIND_COLOR_MAP;
  label: string;
  labelShort: string;
  icon: string;
  href: string;
}> = {
  UPPER_BODY: {
    color: 'orange',
    label: 'Haut du corps',
    labelShort: 'Haut',
    icon: '💪',
    href: '/exercices/upper_body',
  },
  CORE: {
    color: 'teal',
    label: 'Tronc',
    labelShort: 'Tronc',
    icon: '🧍',
    href: '/exercices/core',
  },
  LOWER_BODY: {
    color: 'blue',
    label: 'Jambes',
    labelShort: 'Jambes',
    icon: '🦵',
    href: '/exercices/lower_body',
  },
  STRETCHING: {
    color: 'purple',
    label: 'Étirements',
    labelShort: 'Étirer',
    icon: '🧘‍♀️',
    href: '/exercices/stretching',
  },
  FACE: {
    color: 'amber',
    label: 'Visage',
    labelShort: 'Visage',
    icon: '🙂',
    href: '/exercices/face',
  },
};

// Mapping couleur Tailwind → classes CSS et hex
const TAILWIND_COLOR_MAP = {
  blue: {
    hex: '#3B82F6',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    cardBorder: 'border-blue-100',
    text: 'text-blue-700',
    accent: 'bg-blue-500',
    tag: 'bg-blue-100 text-blue-800',
    focusRing: 'focus:ring-blue-500',
    ring: 'ring-blue-200',
    iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200',
    iconText: 'text-blue-700',
    navActive: 'bg-blue-600 text-white border-blue-600',
    navInactive: 'bg-white text-gray-600 border-blue-300 hover:border-blue-400',
    mobileActive: 'bg-blue-600 text-white border-t-2 border-blue-600',
    mobileInactive: 'bg-white text-gray-600 border-t-2 border-blue-300',
  },
  orange: {
    hex: '#F97316',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    cardBorder: 'border-orange-100',
    text: 'text-orange-800',
    accent: 'bg-orange-500',
    tag: 'bg-orange-100 text-orange-800',
    focusRing: 'focus:ring-orange-500',
    ring: 'ring-orange-200',
    iconBg: 'bg-gradient-to-br from-orange-100 to-orange-200',
    iconText: 'text-orange-700',
    navActive: 'bg-orange-600 text-white border-orange-600',
    navInactive: 'bg-white text-gray-600 border-orange-300 hover:border-orange-400',
    mobileActive: 'bg-orange-600 text-white border-t-2 border-orange-600',
    mobileInactive: 'bg-white text-gray-600 border-t-2 border-orange-300',
  },
  purple: {
    hex: '#8B5CF6',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    cardBorder: 'border-purple-100',
    text: 'text-purple-700',
    accent: 'bg-purple-500',
    tag: 'bg-purple-100 text-purple-800',
    focusRing: 'focus:ring-purple-500',
    ring: 'ring-purple-200',
    iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
    iconText: 'text-purple-700',
    navActive: 'bg-purple-600 text-white border-purple-600',
    navInactive: 'bg-white text-gray-600 border-purple-300 hover:border-purple-400',
    mobileActive: 'bg-purple-600 text-white border-t-2 border-purple-600',
    mobileInactive: 'bg-white text-gray-600 border-t-2 border-purple-300',
  },
  teal: {
    hex: '#14B8A6',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    cardBorder: 'border-teal-100',
    text: 'text-teal-700',
    accent: 'bg-teal-500',
    tag: 'bg-teal-100 text-teal-800',
    focusRing: 'focus:ring-teal-500',
    ring: 'ring-teal-200',
    iconBg: 'bg-gradient-to-br from-teal-100 to-teal-200',
    iconText: 'text-teal-700',
    navActive: 'bg-teal-600 text-white border-teal-600',
    navInactive: 'bg-white text-gray-600 border-teal-300 hover:border-teal-400',
    mobileActive: 'bg-teal-600 text-white border-t-2 border-teal-600',
    mobileInactive: 'bg-white text-gray-600 border-t-2 border-teal-300',
  },
  amber: {
    hex: '#F59E0B',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    cardBorder: 'border-amber-100',
    text: 'text-amber-800',
    accent: 'bg-amber-500',
    tag: 'bg-amber-100 text-amber-800',
    focusRing: 'focus:ring-amber-500',
    ring: 'ring-amber-200',
    iconBg: 'bg-gradient-to-br from-amber-100 to-amber-200',
    iconText: 'text-amber-700',
    navActive: 'bg-amber-600 text-white border-amber-600',
    navInactive: 'bg-white text-gray-600 border-amber-300 hover:border-amber-400',
    mobileActive: 'bg-amber-600 text-white border-t-2 border-amber-600',
    mobileInactive: 'bg-white text-gray-600 border-t-2 border-amber-300',
  },
} as const;

// ============================================================================
// CONSTANTES GÉNÉRÉES - Dérivées de la config de base
// ============================================================================

// Ordre standardisé des catégories (Face en premier)
export const CATEGORY_ORDER: ExerciceCategory[] = ['FACE', 'UPPER_BODY', 'CORE', 'LOWER_BODY', 'STRETCHING'];

/** Catégories affichées dans la barre de navigation desktop (sans Face) */
export const CATEGORY_ORDER_NAV: ExerciceCategory[] = ['UPPER_BODY', 'CORE', 'LOWER_BODY', 'STRETCHING'];

// Labels affichés pour chaque catégorie
export const CATEGORY_LABELS = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => [key, config.label])
) as Record<ExerciceCategory, string>;

// Labels courts pour la navigation
export const CATEGORY_LABELS_SHORT = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => [key, config.labelShort])
) as Record<ExerciceCategory, string>;

// Icônes/Emojis pour chaque catégorie
export const CATEGORY_ICONS = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => [key, config.icon])
) as Record<ExerciceCategory, string>;

// URLs pour chaque catégorie
export const CATEGORY_HREFS = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => [key, config.href])
) as Record<ExerciceCategory, string>;

// Couleurs pour chaque catégorie (palette complète)
export const CATEGORY_COLORS = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
    const colors = TAILWIND_COLOR_MAP[config.color];
    return [key, {
      bg: colors.bg,
      border: colors.border,
      cardBorder: colors.cardBorder,
      text: colors.text,
      accent: colors.accent,
      tag: colors.tag,
      focusRing: colors.focusRing,
      ring: colors.ring,
      iconBg: colors.iconBg,
      iconText: colors.iconText,
    }];
  })
) as Record<ExerciceCategory, {
  bg: string;
  border: string;
  cardBorder: string;
  text: string;
  accent: string;
  tag: string;
  focusRing: string;
  ring: string;
  iconBg: string;
  iconText: string;
}>;

// Configuration pour la navigation desktop
export const CATEGORY_NAV_CONFIG = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
    const colors = TAILWIND_COLOR_MAP[config.color];
    return [key, {
      activeClasses: colors.navActive,
      inactiveClasses: colors.navInactive,
      dotColor: colors.accent,
    }];
  })
) as Record<ExerciceCategory, {
  activeClasses: string;
  inactiveClasses: string;
  dotColor: string;
}>;

// Configuration pour la navigation mobile
export const CATEGORY_MOBILE_CONFIG = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
    const colors = TAILWIND_COLOR_MAP[config.color];
    return [key, {
      label: config.labelShort,
      icon: config.icon,
      href: config.href,
      activeClasses: colors.mobileActive,
      inactiveClasses: colors.mobileInactive,
    }];
  })
) as Record<ExerciceCategory, {
  label: string;
  icon: string;
  href: string;
  activeClasses: string;
  inactiveClasses: string;
}>;

// Styles pour la navigation mobile (nouvelle version harmonisée)
export const CATEGORY_MOBILE_STYLES = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
    const colors = TAILWIND_COLOR_MAP[config.color];
    return [key, {
      iconBg: colors.iconBg,
      iconText: colors.iconText,
      ring: `ring-3 ${colors.ring}`,
    }];
  })
) as Record<ExerciceCategory, {
  iconBg: string;
  iconText: string;
  ring: string;
}>;

// Couleurs HEX pour les graphiques
export const CATEGORY_CHART_COLORS = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => [key, TAILWIND_COLOR_MAP[config.color].hex])
) as Record<ExerciceCategory, string>;

// Couleurs HEX pour l'orthophonie (jaune/amber)
// Utilisées dans les graphiques de progression
export const ORTHOPHONIE_CHART_COLORS = {
  primary: '#FBBF24',    // yellow-400 / amber-400
  gradient: '#EAB308',   // yellow-500 / amber-500
} as const;

// Couleurs pour le heatmap d'activité (version plus vive -400)
const HEATMAP_COLOR_MAP: Record<keyof typeof TAILWIND_COLOR_MAP, { bg: string; border: string }> = {
  orange: { bg: 'bg-orange-400', border: 'border-orange-500' },
  teal: { bg: 'bg-teal-400', border: 'border-teal-500' },
  blue: { bg: 'bg-blue-400', border: 'border-blue-500' },
  purple: { bg: 'bg-purple-400', border: 'border-purple-500' },
  amber: { bg: 'bg-amber-400', border: 'border-amber-500' },
};

export const CATEGORY_HEATMAP_COLORS = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => [key, HEATMAP_COLOR_MAP[config.color]])
) as Record<ExerciceCategory, { bg: string; border: string }>;

// ============================================================================
// BODYPARTS - Configuration des parties du corps
// ============================================================================

// Association bodypart → catégorie mère (source unique de vérité)
export const BODYPART_TO_CATEGORY: Record<string, ExerciceCategory> = {
  // 💪 HAUT DU CORPS
  'Bras': 'UPPER_BODY',
  'Mains': 'UPPER_BODY',
  'Épaules': 'UPPER_BODY',
  'Cou': 'UPPER_BODY',
  // 🧑 VISAGE
  'Mâchoire': 'FACE',
  // Rétrocompatibilité (anciennes valeurs en base)
  'Cou & Nuque': 'UPPER_BODY',
  'Nuque / Cervicales': 'UPPER_BODY',
  // 🤸 MILIEU DU CORPS
  'Dos': 'CORE',
  'Corps': 'CORE',
  'Bassin': 'CORE',
  'Ventre': 'CORE',      // Pour matcher l'input utilisateur simple
  // 🦵 BAS DU CORPS
  'Jambes': 'LOWER_BODY',
  'Fessier': 'LOWER_BODY',
  'Pied': 'LOWER_BODY',
  'Epaules': 'UPPER_BODY',
};

// Liste des bodyparts disponibles (actifs uniquement) — ordre du corps, haut vers le bas
export const AVAILABLE_BODYPARTS = [
  'Mâchoire', 'Cou', 'Épaules', 'Bras', 'Mains',  // Haut
  'Dos', 'Corps', 'Ventre', 'Bassin',                     // Milieu
  'Fessier', 'Jambes', 'Pied',                            // Bas
] as const;

// Icônes pour les bodyparts
export const BODYPART_ICONS: Record<string, string> = {
  'Bras': '💪',
  'Mains': '🖐️',
  'Épaules': '🏋️',
  'Cou': '🦒',
  'Mâchoire': '👄',
  'Cou & Nuque': '🦒',
  'Nuque / Cervicales': '🦒',
  'Dos': '🦴',
  'Corps': '🧍',
  'Bassin': '🩲',
  'Ventre': '🎯',

  'Jambes': '🦵',
  'Fessier': '🍑',
  'Pied': '🦶',
  'Epaules': '🏋️',
};

// Couleurs pour les bodyparts - générées automatiquement depuis BODYPART_TO_CATEGORY
export const BODYPART_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(BODYPART_TO_CATEGORY).map(([bodypart, category]) => {
    const colors = TAILWIND_COLOR_MAP[CATEGORY_CONFIG[category].color];
    return [bodypart, `${colors.bg} ${colors.text}`];
  })
);

// Helper pour obtenir la couleur d'un bodypart (avec fallback)
export function getBodypartColor(bodypart: string): string {
  return BODYPART_COLORS[bodypart] || 'bg-gray-100 text-gray-600';
}

// Helper pour obtenir la couleur hex d'un bodypart pour les charts
export function getBodypartChartColor(bodypart: string): string {
  const category = BODYPART_TO_CATEGORY[bodypart];
  return category ? CATEGORY_CHART_COLORS[category] : '#6B7280';
}

// ============================================================================
// FILTRES D'ÉTAT - Options de filtre pour les exercices
// ============================================================================

export const EXERCICE_STATUS_FILTER_OPTIONS: Array<{
  value: ExerciceStatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'Tous' },
  { value: 'notCompleted', label: 'Non faits' },
  { value: 'completed', label: 'Faits' },
] as const;
