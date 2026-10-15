'use client';

import { MenuRow } from './MenuRow';
import { BellIcon, BookIcon, RocketIcon } from '@/app/components/ui/icons';
import { SITEMAP_ICON_STYLES } from '@/app/constants/sitemap.constants';
import { useLayoutContext } from '@/app/contexts/LayoutContext';
import {
  CATEGORY_COLORS,
  CATEGORY_HREFS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from '@/app/constants/exercice.constants';

type Props = {
  onMenuClose: () => void;
  isMenuOpen: boolean;
};

export function MenuSections({ onMenuClose, isMenuOpen }: Props) {
  const tabIndex = isMenuOpen ? 0 : -1;
  const { notificationBadge, preserveDate } = useLayoutContext();

  return (
    <>
      {/* Zones reachable from anywhere, not only from the home page */}
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1 mt-2">
        Mes zones
      </h3>
      <div className="grid gap-0.5">
        {CATEGORY_ORDER.map((category) => (
          <MenuRow
            key={category}
            href={preserveDate(CATEGORY_HREFS[category])}
            label={CATEGORY_LABELS[category]}
            icon={CATEGORY_ICONS[category]}
            iconClassName={CATEGORY_COLORS[category].iconBg}
            onClick={onMenuClose}
            tabIndex={tabIndex}
          />
        ))}
      </div>

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1 mt-4">
        Pages
      </h3>
      <div className="grid gap-0.5">
        <MenuRow
          href={preserveDate('/historique')}
          label="Ma progression"
          icon={<RocketIcon />}
          iconClassName={`${SITEMAP_ICON_STYLES.primary.parcours.bg} ${SITEMAP_ICON_STYLES.primary.parcours.text}`}
          onClick={onMenuClose}
          tabIndex={tabIndex}
        />
        <MenuRow
          href={preserveDate('/journal')}
          label="Notes"
          icon={<BookIcon />}
          iconClassName={`${SITEMAP_ICON_STYLES.primary.journal.bg} ${SITEMAP_ICON_STYLES.primary.journal.text}`}
          onClick={onMenuClose}
          tabIndex={tabIndex}
        />
        <MenuRow
          href="/notifications"
          label="Notifications"
          icon={<BellIcon />}
          iconClassName="bg-red-500 text-white"
          onClick={onMenuClose}
          tabIndex={tabIndex}
          trailing={notificationBadge}
        />
      </div>
    </>
  );
}
