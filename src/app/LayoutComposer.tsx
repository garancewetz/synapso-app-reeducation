'use client';

import { useMemo, useState, useEffect, useCallback, type PropsWithChildren } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { SelectedDateBanner, TimeMachineWrapper } from '@/app/features/time-machine';
import { usePreserveDateParam } from '@/app/features/time-machine';
import { usePendingShareCount } from '@/app/features/sharing';
import { NotificationBadge } from '@/app/features/sharing';
import { LayoutProvider } from '@/app/contexts/LayoutContext';
import { NavBar } from '@/app/components/NavBar';
import { BottomNavBar } from '@/app/components/BottomNavBar';
import { CategoriesFullOverlay } from '@/app/components/CategoriesFullOverlay';
import { CATEGORY_ORDER, CATEGORY_ORDER_NAV } from '@/app/constants/exercice.constants';
import {
  MENU_CATEGORY_STORAGE_KEY,
  NAV_MENU_TYPE_STORAGE_KEY,
  type NavMenuType,
} from '@/app/constants/settings.constants';
import clsx from 'clsx';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';

const TimeMachineTransition = dynamic(
  () => import('@/app/features/time-machine').then(mod => ({ default: mod.TimeMachineTransition })),
  { ssr: false, loading: () => null }
);

const DayDetailModalWrapper = dynamic(
  () => import('@/app/features/historique').then(mod => ({ default: mod.DayDetailModalWrapper })),
  { ssr: false }
);

const GlobalCelebration = dynamic(
  () => import('@/app/features/exercices').then(mod => ({ default: mod.GlobalCelebration })),
  { ssr: false }
);

const WebVitals = dynamic(
  () => import('@/app/components/WebVitals').then(mod => ({ default: mod.WebVitals })),
  { ssr: false }
);

const PWARegister = dynamic(
  () => import('@/app/components/PWARegister').then(mod => ({ default: mod.PWARegister })),
  { ssr: false }
);

const VALID_MENU_TYPES: NavMenuType[] = ['category', 'slide'];

function readNavMenuType(): NavMenuType {
  if (typeof window === 'undefined') return 'category';
  const raw = localStorage.getItem(NAV_MENU_TYPE_STORAGE_KEY);
  if (raw && VALID_MENU_TYPES.includes(raw as NavMenuType)) return raw as NavMenuType;
  if (raw === 'page') return 'category';
  const legacy = localStorage.getItem(MENU_CATEGORY_STORAGE_KEY);
  if (legacy === 'false') return 'slide';
  return 'category';
}

export function LayoutComposer({ children }: PropsWithChildren) {
  const preserveDate = usePreserveDateParam();
  const { count: pendingShareCount } = usePendingShareCount();
  const [navMenuType, setNavMenuTypeState] = useState<NavMenuType>('category');
  const [categoriesOverlayOpen, setCategoriesOverlayOpen] = useState(false);
  const [categoriesSlideOpen, setCategoriesSlideOpen] = useState(false);

  useEffect(() => {
    setNavMenuTypeState(readNavMenuType());
  }, []);

  const setNavMenuType = useCallback((value: NavMenuType) => {
    setNavMenuTypeState(value);
    localStorage.setItem(NAV_MENU_TYPE_STORAGE_KEY, value);
  }, []);

  const showCategoryMenu = navMenuType === 'category';

  const navCategories = useMemo(() => ({
    forNav: CATEGORY_ORDER_NAV,
    forDesktop: CATEGORY_ORDER,
  }), []);
  const notificationBadge = <NotificationBadge className="absolute top-1/2 -translate-y-1/2 right-2" />;

  // Focus mode: the session is full screen — no navigation to distract or mis-tap.
  const isFocusMode = usePathname() === '/seance';

  const timeMachineContent = isFocusMode ? (
    <>
      <SelectedDateBanner />
      <main id="main-content" className="flex-1 w-full">
        {children}
      </main>
    </>
  ) : (
    <>
      <SelectedDateBanner />
      <NavBar />
      <main
        id="main-content"
        className={clsx(
          // Room for the fixed bottom bar on mobile (pages add only their own small padding)
          'flex-1 mx-auto w-full max-w-10xl pb-28 md:pb-8 lg:bg-white',
        )}
      >
        {children}
      </main>
      <BottomNavBar />
    </>
  );

  const hasHorseshoeNav = false;

  return (
    <LayoutProvider
      value={{
        preserveDate,
        pendingShareCount,
        notificationBadge,
        navCategories,
        hasHorseshoeNav,
        navMenuType,
        setNavMenuType,
        showCategoryMenu,
        categoriesOverlayOpen,
        setCategoriesOverlayOpen,
        categoriesSlideOpen,
        setCategoriesSlideOpen,
      }}
    >
      <WebVitals />
      <PWARegister />
      <a
        href="#main-content"
        className="fixed left-0 top-0 z-[200] -translate-y-full bg-gray-900 text-white px-4 py-3 rounded-br font-medium transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
      >
        Aller au contenu
      </a>
      <TimeMachineTransition />
      <ErrorBoundary>
        <TimeMachineWrapper>
          {timeMachineContent}
        </TimeMachineWrapper>
      </ErrorBoundary>
      <CategoriesFullOverlay />
      <DayDetailModalWrapper />
      <GlobalCelebration />
    </LayoutProvider>
  );
}
