'use client';

import { usePathname } from 'next/navigation';
import { MenuRow } from './MenuRow';
import { PlusIcon, SparklesIcon } from '@/app/components/ui/icons';
import { MENU_COLORS } from '@/app/constants/card.constants';
import { PROGRESS_ADD_HREF } from '@/app/constants/progress.constants';

type Props = {
  onMenuClose: () => void;
  isMenuOpen: boolean;
};

type MenuAction = {
  href: (pathname: string) => string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  iconBgColor: string;
  iconTextColor: string;
}

function getMenuActions(): MenuAction[] {
  return [
    {
      href: (pathname: string) => `/exercice/add?from=${encodeURIComponent(pathname)}`,
      icon: <PlusIcon />,
      title: 'Ajouter un exercice',
      iconBgColor: MENU_COLORS.ADD_EXERCICE.bg,
      iconTextColor: MENU_COLORS.ADD_EXERCICE.text,
    },
    {
      href: () => PROGRESS_ADD_HREF,
      icon: <SparklesIcon />,
      title: 'Noter un progrès',
      iconBgColor: MENU_COLORS.PROGRES.bg,
      iconTextColor: MENU_COLORS.PROGRES.text,
    },
  ];
}

export function MenuActions({ onMenuClose, isMenuOpen }: Props) {
  const pathname = usePathname();
  const tabIndex = isMenuOpen ? 0 : -1;

  const menuActions = getMenuActions();

  return (
    <>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1 mt-4">
        Ajouter
      </h3>
      <div className="grid gap-0.5">
        {menuActions.map((action) => (
          <MenuRow
            key={action.title}
            href={action.href(pathname)}
            label={action.title}
            icon={action.icon}
            iconClassName={`${action.iconBgColor} ${action.iconTextColor}`}
            onClick={onMenuClose}
            tabIndex={tabIndex}
          />
        ))}
      </div>
    </>
  );
}

