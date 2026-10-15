'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { formatShortDate } from '@/app/utils/date.utils';
import type { PeriodProgress } from '../hooks/usePeriodProgress';

type Props = {
  progress: PeriodProgress | null;
  resetFrequency?: 'DAILY' | 'WEEKLY' | null;
};

/** "Cette semaine — 1 / 4 exercices": the user's real list, not an arbitrary goal. */
export function PeriodProgressBar({ progress, resetFrequency }: Props) {
  const { isTimeMachineMode, selectedDate } = useTimeContext();
  const isLoading = progress === null;
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 0;
  const ratio = total > 0 ? Math.min(done / total, 1) : 0;
  const isComplete = total > 0 && done >= total;

  const label = useMemo(() => {
    if (isTimeMachineMode && selectedDate) return `Au ${formatShortDate(selectedDate)}`;
    return resetFrequency === 'WEEKLY' ? 'Cette semaine' : "Aujourd'hui";
  }, [isTimeMachineMode, selectedDate, resetFrequency]);

  if (!isLoading && total === 0) return null;

  return (
    <div className="mb-4 relative z-10 px-3 md:px-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm font-semibold text-gray-700" aria-live="polite" aria-atomic="true">
          {isLoading ? '...' : `${done} / ${total} exercice${total > 1 ? 's' : ''}`}
        </span>
      </div>
      <div
        className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={isLoading ? 'Progression : chargement' : `Progression : ${done} sur ${total} exercices faits`}
      >
        <motion.div
          className={clsx(
            'h-full rounded-full',
            isComplete
              ? 'bg-linear-to-r from-emerald-500 to-emerald-600'
              : 'bg-linear-to-r from-teal-400 to-emerald-500'
          )}
          initial={{ width: '0%' }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: isLoading ? 0 : 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
