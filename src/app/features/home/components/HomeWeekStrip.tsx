'use client';

import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckIcon } from '@/app/components/ui/icons';
import { useTimeContext } from '@/app/contexts/TimeContext';
import type { HeatmapDay } from '@/app/features/historique';

type Props = {
  weekData: HeatmapDay[];
  resetFrequency?: 'DAILY' | 'WEEKLY' | null;
  onDayClick?: (day: HeatmapDay) => void;
};

/**
 * The week as 7 rounds, readable at a glance: filled = active day, ringed =
 * today, empty = past day without exercise, dashed = days to come.
 */
export function HomeWeekStrip({ weekData, resetFrequency, onDayClick }: Props) {
  const { referenceDateKey } = useTimeContext();
  if (weekData.length !== 7) return null;

  const activeDays = weekData.filter((day) => day.count > 0).length;
  const caption =
    activeDays === 0
      ? 'Aucun jour actif pour l’instant'
      : `${activeDays} jour${activeDays > 1 ? 's' : ''} actif${activeDays > 1 ? 's' : ''} ${resetFrequency === 'WEEKLY' ? 'cette semaine' : 'sur 7 jours'}`;

  return (
    <div>
      <ol className="grid grid-cols-7 gap-1" aria-label={caption}>
        {weekData.map((day) => {
          const isFuture = day.dateKey > referenceDateKey;
          const isDone = day.count > 0;
          const isCurrent = day.dateKey === referenceDateKey;
          const letter = day.date ? format(day.date, 'EEEEE', { locale: fr }).toUpperCase() : '';
          const dayLabel = day.date ? format(day.date, 'EEEE d MMMM', { locale: fr }) : '';
          const round = (
            <span
              className={clsx(
                'flex items-center justify-center w-9 h-9 rounded-full transition-colors',
                isDone && 'bg-emerald-500 text-white',
                !isDone && isCurrent && 'bg-white ring-2 ring-emerald-500',
                !isDone && !isCurrent && !isFuture && 'bg-gray-100',
                isFuture && 'border-2 border-dashed border-gray-200',
                isDone && isCurrent && 'ring-2 ring-emerald-500 ring-offset-2'
              )}
            >
              {isDone && <CheckIcon className="w-4 h-4" />}
            </span>
          );
          return (
            <li key={day.dateKey} className="flex flex-col items-center gap-1">
              <span className={clsx('text-xs font-semibold', isCurrent ? 'text-emerald-700' : 'text-gray-400')} aria-hidden="true">
                {letter}
              </span>
              {onDayClick && !isFuture ? (
                <button
                  type="button"
                  onClick={() => onDayClick(day)}
                  aria-label={`${dayLabel} : ${isDone ? `${day.count} exercice${day.count > 1 ? 's' : ''}` : 'aucun exercice'}`}
                  className="rounded-full active:scale-95 transition-transform"
                >
                  {round}
                </button>
              ) : (
                <span aria-label={`${dayLabel} : à venir`}>{round}</span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-sm text-gray-500">{caption}</p>
    </div>
  );
}
