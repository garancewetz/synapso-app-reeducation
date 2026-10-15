'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';
import { TouchLink } from '@/app/components/TouchLink';

type Props = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Background + text colour classes of the icon square. */
  iconClassName: string;
  onClick?: () => void;
  tabIndex?: number;
  /** Rendered at the end of the row (e.g. a notification badge). */
  trailing?: ReactNode;
};

/** One compact menu entry: icon square + label, a 44px touch target. */
export function MenuRow({ href, label, icon, iconClassName, onClick, tabIndex, trailing }: Props) {
  return (
    <TouchLink
      href={href}
      onClick={onClick}
      tabIndex={tabIndex}
      data-menu-item="true"
      className="relative flex items-center gap-3 min-h-[44px] px-2 rounded-lg text-base font-medium text-gray-800! active:bg-gray-100 md:hover:bg-gray-50"
    >
      <span className={clsx('flex items-center justify-center w-8 h-8 rounded-lg text-lg [&_svg]:w-4 [&_svg]:h-4', iconClassName)} aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {trailing}
    </TouchLink>
  );
}
