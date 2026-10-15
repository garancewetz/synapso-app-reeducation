import { CATEGORY_LABELS, CATEGORY_HREFS, CATEGORY_ICONS } from '@/app/constants/exercice.constants';
import { JOURNAL_EMOJI, NAVIGATION_EMOJIS } from '@/app/constants/emoji.constants';
import type { ExerciceCategory } from '@/app/types/exercice';

/**
 * Obtient le nom de la page actuelle basé sur le pathname
 * Utilise un langage simple et clair (FALC) pour les personnes ayant subi un AVC
 * Accepte un pathname avec ou sans query string (ex. /journal?date=yyyy-MM-dd)
 */
export function getCurrentPageName(pathname: string): string | null {
  const path = (pathname || '').split('?')[0];
  // Page d'accueil
  if (path === '/') {
    return 'Accueil';
  }

  // Catégories d'exercices
  for (const category of Object.keys(CATEGORY_HREFS) as ExerciceCategory[]) {
    if (path === CATEGORY_HREFS[category]) {
      return CATEGORY_LABELS[category];
    }
  }

  // Historique
  if (path === '/historique') {
    return 'Ma progression';
  }

  // Journal
  if (path === '/journal') {
    return 'Notes';
  }

  if (path === '/journal/add') {
    return 'Nouvelle note';
  }

  if (path.startsWith('/journal/edit/')) {
    return 'Modifier la note';
  }

  // Exercices
  if (path === '/exercice/add') {
    return 'Ajouter un exercice';
  }

  if (path.startsWith('/exercice/edit/')) {
    return 'Modifier un exercice';
  }

  // Page vue globale
  if (path === '/exercices/all' || path.startsWith('/exercices/all')) {
    return 'Par équipement';
  }

  // Pages d'exercices par catégorie - extraire la catégorie de l'URL
  const categoryMatch = path.match(/^\/exercices\/([^\/]+)$/);
  if (categoryMatch) {
    const categoryParam = categoryMatch[1];
    // Convertir "upper_body" en "UPPER_BODY"
    const categoryKey = categoryParam.toUpperCase().replace(/-/g, '_') as ExerciceCategory;
    if (categoryKey in CATEGORY_LABELS) {
      return CATEGORY_LABELS[categoryKey];
    }
  }

  // Paramètres
  if (path === '/settings') {
    return 'Mon profil';
  }

  // Page non reconnue
  return null;
}

/**
 * Obtient l'emoji associé à une page basé sur le pathname
 * Retourne null si aucun emoji n'est défini pour cette page
 */
export function getPageEmoji(pathname: string): string | null {
  const path = (pathname || '').split('?')[0];
  // Page d'accueil
  if (path === '/') {
    return NAVIGATION_EMOJIS.HOME;
  }

  // Catégories d'exercices
  for (const category of Object.keys(CATEGORY_HREFS) as ExerciceCategory[]) {
    if (path === CATEGORY_HREFS[category]) {
      return CATEGORY_ICONS[category];
    }
  }

  // Historique
  if (path === '/historique') {
    return NAVIGATION_EMOJIS.ROCKET;
  }

  // Journal
  if (path === '/journal') {
    return JOURNAL_EMOJI;
  }

  if (path === '/journal/add') {
    return JOURNAL_EMOJI;
  }

  if (path.startsWith('/journal/edit/')) {
    return JOURNAL_EMOJI;
  }

  // Pages d'exercices par catégorie - extraire la catégorie de l'URL
  const categoryMatch = path.match(/^\/exercices\/([^\/]+)$/);
  if (categoryMatch) {
    const categoryParam = categoryMatch[1];
    // Convertir "upper_body" en "UPPER_BODY"
    const categoryKey = categoryParam.toUpperCase().replace(/-/g, '_') as ExerciceCategory;
    if (categoryKey in CATEGORY_ICONS) {
      return CATEGORY_ICONS[categoryKey];
    }
  }

  // Page non reconnue
  return null;
}
