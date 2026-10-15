'use client';

import { memo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { NAVIGATION_EMOJIS } from '@/app/constants/emoji.constants';
import { TouchLink } from '@/app/components/TouchLink';
import { MapIcon } from '@/app/components/ui/icons';
import { useUser } from '@/app/contexts/UserContext';
import { useLayoutContext } from '@/app/contexts/LayoutContext';
import { useStopScrollOnTouch } from '@/app/hooks/useStopScrollOnTouch';

const PROGRESSION_HREF = '/historique';

/**
 * Three destinations, the main gesture in the middle under the thumb:
 * Accueil · ▶ Séance · Progression. Body zones live on the home page and adding
 * things in the ☰ menu and on the relevant pages — no duplicate entry points.
 */
export const BottomNavBar = memo(function BottomNavBar() {
  const pathname = usePathname();
  const { effectiveUser, loading } = useUser();
  const { preserveDate } = useLayoutContext();
  const stopScrollOnTouch = useStopScrollOnTouch();
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktopLayout(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!effectiveUser || loading || isDesktopLayout) {
    return null;
  }

  const isHomeActive = pathname === '/';
  const isProgressionActive = pathname === PROGRESSION_HREF || pathname.startsWith(`${PROGRESSION_HREF}/`);

  const sideItem = (href: string, label: string, icon: React.ReactNode, isActive: boolean) => (
    <TouchLink
      href={preserveDate(href)}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={clsx(
        'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] rounded-2xl transition-colors',
        isActive ? 'text-gray-900! bg-gray-100' : 'text-gray-500!'
      )}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </TouchLink>
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-60 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] touch-manipulation transform-[translateZ(0)]"
      aria-label="Navigation principale"
      onTouchStart={stopScrollOnTouch}
    >
      <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-white/70 bg-white/85 backdrop-blur-md shadow-lg">
        {sideItem(
          '/',
          'Accueil',
          <span className="text-xl leading-none" aria-hidden="true">{NAVIGATION_EMOJIS.HOME}</span>,
          isHomeActive
        )}

        <TouchLink
          href={preserveDate('/seance')}
          aria-label="Commencer ma séance"
          className="flex-[1.3] flex items-center justify-center gap-2 min-h-[56px] rounded-2xl bg-emerald-500 text-emerald-950! shadow-md active:scale-[0.97] transition-transform"
        >
          <span className="text-lg leading-none" aria-hidden="true">▶</span>
          <span className="text-base font-semibold">Séance</span>
        </TouchLink>

        {sideItem(PROGRESSION_HREF, 'Progression', <MapIcon className="w-5 h-5" aria-hidden />, isProgressionActive)}
      </div>
    </nav>
  );
});
