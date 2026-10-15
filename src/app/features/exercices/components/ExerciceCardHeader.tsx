'use client';

import { useMemo } from 'react';
import clsx from 'clsx';
import type { Exercice } from '@/app/types';
import { Badge, WeeklyCompletionIndicator } from '@/app/components/ui';
import { EyeIcon, BookmarkIcon } from '@/app/components/ui/icons';

type Props = {
  exercice: Exercice;
  effectiveUserResetFrequency?: 'DAILY' | 'WEEKLY';
  onOpenMedia: (e: React.MouseEvent) => void;
};

export function ExerciceCardHeader({ exercice, effectiveUserResetFrequency, onOpenMedia }: Props) {
  const hasMedia = useMemo(
    () => exercice.media && 
      exercice.media.photos && exercice.media.photos.length > 0,
    [exercice.media]
  );

  const isWeekly = effectiveUserResetFrequency === 'WEEKLY';
  const weeklyCount = exercice.weeklyCompletions?.length ?? 0;
  const showWeeklyBadge = isWeekly && weeklyCount > 0;
  const showDailyBadge = !isWeekly && exercice.completedToday;

  // What to do, readable without expanding the card: "3 séries · 10× · 30 secondes"
  const { series, repeat, duration } = exercice.workout;
  const workoutSummary = [
    series && series !== '1' && `${series} séries`,
    repeat && `${repeat}×`,
    duration,
  ].filter(Boolean).join(' · ');

  return (
    <div className="relative mb-3 pr-24">
      <div className="flex items-center gap-2 min-w-0">
        {hasMedia && (
          <button
            type="button"
            onClick={onOpenMedia}
            className={clsx(
              'flex items-center justify-center',
              'w-6 h-6 rounded-md',
              'bg-transparent text-gray-400',
              'transition-all duration-200',
              'md:hover:bg-gray-50 md:hover:text-gray-500',
              'active:bg-gray-50 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2',
              'shrink-0',
              'touch-manipulation'
            )}
            aria-label="Voir les photos de l'exercice"
            title="Voir les photos"
          >
            <EyeIcon className="w-3 h-3" strokeWidth={2} />
          </button>
        )}
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 leading-tight min-w-0">
            {exercice.name}
          </h3>
          {workoutSummary && (
            <p className="mt-1 text-sm font-medium text-gray-600">{workoutSummary}</p>
          )}
        </div>
      </div>

      <div className="absolute top-0 right-0 flex items-center justify-end gap-1.5 min-w-20">
        {exercice.pinned && (
          <BookmarkIcon className="w-4 h-4 text-amber-500" filled />
        )}
        {showWeeklyBadge && (
          <WeeklyCompletionIndicator completions={exercice.weeklyCompletions ?? []} />
        )}
        {showDailyBadge && (
          <Badge variant="completed">Fait</Badge>
        )}
      </div>
    </div>
  );
}

