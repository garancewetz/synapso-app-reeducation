'use client';

import clsx from 'clsx';
import { TouchLink } from '@/app/components/TouchLink';
import {
  CATEGORY_COLORS,
  CATEGORY_HREFS,
  CATEGORY_ICONS,
  CATEGORY_LABELS_SHORT,
  CATEGORY_ORDER,
} from '@/app/constants/exercice.constants';
import { usePreserveDateParam } from '@/app/features/time-machine';
import type { ExerciceCategory } from '@/app/types/exercice';

type Props = {
  current: ExerciceCategory;
};

/** The 5 zones as one row of shortcuts: jump from a zone to another without going home. */
export function ZoneSwitcher({ current }: Props) {
  const preserveDate = usePreserveDateParam();

  return (
    <nav aria-label="Changer de zone" className="grid grid-cols-5 gap-1.5">
      {CATEGORY_ORDER.map((category) => {
        const isCurrent = category === current;
        return (
          <TouchLink
            key={category}
            href={preserveDate(CATEGORY_HREFS[category])}
            aria-current={isCurrent ? 'page' : undefined}
            className={clsx(
              'flex flex-col items-center justify-center gap-0.5 min-h-[56px] rounded-xl border transition-colors',
              isCurrent ? `${CATEGORY_COLORS[category].bg} ${CATEGORY_COLORS[category].border}` : 'border-transparent bg-gray-50'
            )}
          >
            <span className={clsx('text-xl leading-none', !isCurrent && 'opacity-70')} aria-hidden="true">
              {CATEGORY_ICONS[category]}
            </span>
            <span className={clsx('text-[11px] font-semibold leading-tight', isCurrent ? 'text-gray-900' : 'text-gray-500')}>
              {CATEGORY_LABELS_SHORT[category]}
            </span>
          </TouchLink>
        );
      })}
    </nav>
  );
}
