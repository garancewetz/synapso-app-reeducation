'use client';

import clsx from 'clsx';
import { TouchLink } from '@/app/components/TouchLink';
import { CheckIcon, ChevronIcon } from '@/app/components/ui/icons';
import {
  CATEGORY_COLORS,
  CATEGORY_HREFS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from '@/app/constants/exercice.constants';
import { usePreserveDateParam } from '@/app/features/time-machine';
import type { Exercice, ExerciceCategory } from '@/app/types/exercice';

type Props = {
  /** Active (non-archived) exercises. */
  exercices: Exercice[];
  loading: boolean;
};

/**
 * The 5 body zones, always in the same order and all visible at a glance:
 * one compact row each with "done / total" for the period. An empty zone stays
 * in place (greyed, "Ajouter") so the list never changes shape.
 */
export function HomeCategoryList({ exercices, loading }: Props) {
  const preserveDate = usePreserveDateParam();

  const counts = new Map<ExerciceCategory, { done: number; total: number }>(
    CATEGORY_ORDER.map((category) => [category, { done: 0, total: 0 }])
  );
  for (const exercice of exercices) {
    const count = counts.get(exercice.category);
    if (!count) continue;
    count.total += 1;
    if (exercice.completed) count.done += 1;
  }

  return (
    <nav aria-label="Zones du corps">
      <ul className="rounded-2xl bg-white border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {CATEGORY_ORDER.map((category) => {
          const { done, total } = counts.get(category)!;
          const isEmpty = !loading && total === 0;
          const isComplete = total > 0 && done >= total;
          const styles = CATEGORY_COLORS[category];
          const href = isEmpty
            ? preserveDate(`/exercice/add?category=${category.toLowerCase()}`)
            : preserveDate(CATEGORY_HREFS[category]);

          return (
            <li key={category}>
              <TouchLink
                href={href}
                aria-label={
                  isEmpty
                    ? `${CATEGORY_LABELS[category]} : aucun exercice, en ajouter un`
                    : `${CATEGORY_LABELS[category]} : ${done} sur ${total} faits`
                }
                className="flex items-center gap-3 px-4 min-h-[60px] active:bg-gray-50 md:hover:bg-gray-50 transition-colors"
              >
                <span
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl',
                    isEmpty ? 'bg-gray-100 grayscale opacity-60' : styles.iconBg
                  )}
                  aria-hidden="true"
                >
                  {CATEGORY_ICONS[category]}
                </span>
                <span className={clsx('flex-1 text-base font-semibold', isEmpty ? 'text-gray-400' : 'text-gray-800')}>
                  {CATEGORY_LABELS[category]}
                </span>
                {loading ? (
                  <span className="h-5 w-10 rounded bg-gray-100 animate-pulse" aria-hidden="true" />
                ) : isEmpty ? (
                  <span className="text-sm font-medium text-gray-400">Ajouter</span>
                ) : (
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums',
                      isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                    )}
                    aria-hidden="true"
                  >
                    {isComplete && <CheckIcon className="w-4 h-4" />}
                    {done}/{total}
                  </span>
                )}
                <ChevronIcon direction="right" className="w-4 h-4 text-gray-300 shrink-0" />
              </TouchLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
