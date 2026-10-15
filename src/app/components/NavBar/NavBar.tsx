'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/app/contexts/UserContext';
import { Logo, Loader } from '@/app/components';
import { UserBadge } from '@/app/components/UserBadge';
import { BellIcon, ChevronIcon, MenuIcon } from '@/app/components/ui/icons';
import { Button } from '@/app/components/ui/Button';
import { useMenuState } from '@/app/hooks/useMenuState';
import { useBodyScrollLock } from '@/app/hooks/useBodyScrollLock';
import { useHandPreference } from '@/app/hooks/useHandPreference';
import { useStopScrollOnTouch } from '@/app/hooks/useStopScrollOnTouch';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { isToday } from 'date-fns';
import clsx from 'clsx';
import { MenuDrawer } from './MenuDrawer';
import { TouchLink } from '@/app/components/TouchLink';
import { useLayoutContext } from '@/app/contexts/LayoutContext';
import {
  CATEGORY_HREFS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '@/app/constants/exercice.constants';

/**
 * Composant NavBar - Barre de navigation principale avec menu latéral
 * 
 * Fonctionnalités :
 * - Navigation horizontale sur desktop (Accueil + catégories)
 * - Menu latéral avec trap focus pour l'accessibilité
 * - Affichage de l'utilisateur actuel
 * - Support de la préférence de main (gauche/droite)
 */
export function NavBar() {
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { effectiveUser, loading } = useUser();
  const { isOpen, openMenu, closeMenu } = useMenuState();
  const { isLeftHanded } = useHandPreference();
  const { preserveDate, pendingShareCount } = useLayoutContext();
  const { selectedDate, isDateSelected } = useTimeContext();
  const stopScrollOnTouch = useStopScrollOnTouch();

  // Bloquer le scroll du body quand le menu est ouvert
  useBodyScrollLock(isOpen);

  // ⚡ MODE SABLIER: Ajouter un padding-top si la bannière est visible
  const isBannerVisible = isDateSelected && selectedDate && !isToday(selectedDate);

  const { navCategories } = useLayoutContext();
  const categories = navCategories.forDesktop;
  const isHomeActive = pathname === '/';
  const isHistoriqueActive = pathname === '/historique';
  const isJournalActive = pathname === '/journal' || pathname.startsWith('/journal/');
  const isNotificationsActive = pathname === '/notifications';
  const isAnyCategoryActive = categories.some((cat) => pathname === CATEGORY_HREFS[cat]);
  const activeCategory = categories.find((cat) => pathname === CATEGORY_HREFS[cat]);
  const activeCategoryColors = activeCategory ? CATEGORY_COLORS[activeCategory] : null;

  const [isExercicesDropdownOpen, setIsExercicesDropdownOpen] = useState(false);
  const exercicesDropdownRef = useRef<HTMLDivElement>(null);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);

  const closeExercicesDropdown = useCallback(() => setIsExercicesDropdownOpen(false), []);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopLayout(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isExercicesDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (exercicesDropdownRef.current && !exercicesDropdownRef.current.contains(event.target as Node)) {
        closeExercicesDropdown();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeExercicesDropdown();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExercicesDropdownOpen, closeExercicesDropdown]);

  return (
    <>
      {/* Header minimaliste */}
      <header
        onTouchStart={stopScrollOnTouch}
        className={clsx(
        'bg-white/95 backdrop-blur-sm max-w-8xl w-full mx-auto rounded-md mb-4 md:mb-4 px-4 md:px-6',
        'md:sticky md:top-0 md:z-50 md:border-b md:border-gray-100',
        'transition-all duration-300',
        // ⚡ MODE SABLIER: Ajouter un padding-top pour laisser de la place à la bannière fixe
        // La bannière fait environ 70-80px de hauteur (py-2.5 + 2 lignes de texte + border)
        // On utilise pt-24 (96px) pour avoir une marge de sécurité
        isBannerVisible && 'pt-20 sm:pt-24'
      )}>
        <div
          className={clsx(
            'flex items-center py-3 md:py-2.5 justify-between',
            isLeftHanded && 'flex-row-reverse'
          )}
        >
          {/* Logo et nom */}
          <div className={clsx(
            'flex items-center gap-3 shrink-0',
            isLeftHanded && 'flex-row-reverse'
          )}>
            <TouchLink
              href={preserveDate('/')}
              className={clsx(
                'flex items-center gap-2 px-2 rounded-xl hover:bg-gray-50 transition-colors shrink-0 cursor-pointer',
                !isLeftHanded && '-ml-2'
              )}
              aria-label="Retour à l'accueil Synapso"
            >
              <Logo size={36} />
              <span className="text-base text-gray-800 font-semibold">Synapso</span>
            </TouchLink>
          </div>

          {/* Navigation desktop - Masquée sur mobile */}
          <nav
            className={clsx(
              'items-center flex-1 justify-center px-2 gap-1',
              isDesktopLayout ? 'flex' : 'hidden'
            )}
            aria-label="Navigation principale"
          >
            {/* Groupe 1 : Accueil + Exercices (dropdown, masqué si menu catégorie désactivé) */}
            <div className="flex items-center gap-0.5">
              <TouchLink
                href={preserveDate('/')}
                className={clsx(
                  'relative px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md',
                  'hover:text-gray-900 hover:bg-gray-50',
                  isHomeActive ? 'text-gray-900' : 'text-gray-600'
                )}
                aria-label="Accueil"
                aria-current={isHomeActive ? 'page' : undefined}
              >
                Accueil
                {isHomeActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-gray-900 rounded-full" />
                )}
              </TouchLink>

              {/* The main gesture, also on desktop (the mobile bottom bar is hidden here) */}
              <TouchLink
                href={preserveDate('/seance')}
                className="mx-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-emerald-950! text-sm font-semibold hover:bg-emerald-400 transition-colors"
                aria-label="Commencer ma séance"
              >
                <span aria-hidden="true">▶</span>
                Séance
              </TouchLink>

              <div ref={exercicesDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsExercicesDropdownOpen((open) => !open)}
                  className={clsx(
                    'relative flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md',
                    'hover:bg-gray-50',
                    isAnyCategoryActive && activeCategoryColors
                      ? activeCategoryColors.text
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                  aria-expanded={isExercicesDropdownOpen}
                  aria-haspopup="true"
                  aria-label={isExercicesDropdownOpen ? 'Fermer le menu Mes zones' : 'Ouvrir le menu Mes zones'}
                >
                  Mes zones
                  <ChevronIcon
                    direction="down"
                    className={clsx('w-4 h-4 transition-transform', isExercicesDropdownOpen && 'rotate-180')}
                    aria-hidden
                  />
                  {isAnyCategoryActive && activeCategoryColors && (
                    <span
                      className={clsx(
                        'absolute bottom-0 left-1 right-1 h-0.5 rounded-full',
                        activeCategoryColors.accent
                      )}
                    />
                  )}
                </button>
                {isExercicesDropdownOpen && (
                  <ul
                    role="menu"
                    className="absolute top-full left-0 mt-0.5 min-w-[180px] py-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50"
                  >
                    {categories.map((category) => {
                      const colors = CATEGORY_COLORS[category];
                      const label = CATEGORY_LABELS[category];
                      const href = CATEGORY_HREFS[category];
                      const isActive = pathname === href;
                      return (
                        <li key={category} role="none">
                          <TouchLink
                            href={preserveDate(href)}
                            role="menuitem"
                            className={clsx(
                              'block px-3 py-2 text-sm font-medium rounded-md mx-1',
                              'hover:bg-gray-50',
                              isActive ? colors.text : 'text-gray-700'
                            )}
                            aria-label={label}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={closeExercicesDropdown}
                          >
                            {label}
                          </TouchLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Séparateur visuel entre navigation principale et secondaire */}
            <span className="w-px h-5 bg-gray-200 mx-1" aria-hidden />

            {/* Groupe 2 : Ma progression + Notes */}
            <div className="flex items-center gap-0.5">
              <TouchLink
                href={preserveDate('/historique')}
                className={clsx(
                  'relative px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md',
                  'hover:bg-gray-50',
                  isHistoriqueActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                )}
                aria-label="Ma progression"
                aria-current={isHistoriqueActive ? 'page' : undefined}
              >
                Ma progression
                {isHistoriqueActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-gray-900 rounded-full" />
                )}
              </TouchLink>
              <TouchLink
                href={preserveDate('/journal')}
                className={clsx(
                  'relative px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md',
                  'hover:bg-gray-50',
                  isJournalActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                )}
                aria-label="Notes"
                aria-current={isJournalActive ? 'page' : undefined}
              >
                Notes
                {isJournalActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-gray-900 rounded-full" />
                )}
              </TouchLink>
            </div>
          </nav>

          {/* Badge utilisateur, notifications (desktop = icône seule), bouton menu */}
          <div className={clsx(
            'flex items-center gap-2 shrink-0',
            isLeftHanded && 'flex-row-reverse'
          )}>
            {effectiveUser && (
              <UserBadge size="sm" />
            )}

            {/* Notifications desktop : icône seule à droite */}
            <TouchLink
              href={preserveDate('/notifications')}
              className={clsx(
                'relative p-2.5 rounded-md transition-colors hidden md:flex',
                'hover:bg-gray-50',
                isNotificationsActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
              aria-label={pendingShareCount > 0 ? `${pendingShareCount} notification${pendingShareCount > 1 ? 's' : ''} en attente` : 'Notifications'}
              aria-current={isNotificationsActive ? 'page' : undefined}
            >
              <BellIcon className="w-5 h-5" />
              {pendingShareCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"
                  aria-hidden
                />
              )}
            </TouchLink>

            {/* Cloche notifications — visible sur mobile uniquement quand il y a des notifications */}
            {pendingShareCount > 0 && (
              <TouchLink
                href="/notifications"
                className="relative md:hidden p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={`${pendingShareCount} notification${pendingShareCount > 1 ? 's' : ''} en attente`}
              >
                <BellIcon className="w-6 h-6" />
                <span
                  className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                  aria-hidden="true"
                />
              </TouchLink>
            )}

            <Button
              iconOnly
              ref={menuButtonRef}
              onClick={openMenu}
              disabled={loading}
              className="p-2.5! text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Ouvrir le menu"
              aria-expanded={isOpen}
              aria-controls="main-menu"
            >
              {loading ? (
                <Loader size="md" />
              ) : (
                <MenuIcon className="w-6 h-6 flex items-center justify-center" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Menu latéral avec trap focus */}
      <MenuDrawer
        isOpen={isOpen}
        onClose={closeMenu}
        effectiveUser={effectiveUser}
        menuButtonRef={menuButtonRef}
      />
    </>
  );
}
