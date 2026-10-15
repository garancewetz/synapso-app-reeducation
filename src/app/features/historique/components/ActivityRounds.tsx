'use client';

import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTimeContext } from '@/app/contexts/TimeContext';
import type { HeatmapDay } from '../utils/historique.types';

type Props = {
  /** Consecutive days, oldest → newest (e.g. the 28 days of a period). */
  days: HeatmapDay[];
  onDayClick?: (day: HeatmapDay) => void;
};

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Days as rounds on a Monday-first 7-column grid (leading `isEmpty` days are
 * the alignment padding of getHeatmapData), same language as the home week strip:
 * filled = active day, ringed = today (or the time-machine day), grey = no exercise.
 * The day number sits in the round, so no legend is needed.
 */
export function ActivityRounds({ days, onDayClick }: Props) {
  const { referenceDateKey } = useTimeContext();

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5" aria-hidden="true">
        {WEEKDAYS.map((letter, index) => (
          <span key={index} className="text-center text-xs font-semibold text-gray-400">{letter}</span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          if (day.isEmpty || !day.date) return <li key={day.dateKey} aria-hidden="true" />;
          const isDone = day.count > 0;
          const isCurrent = day.dateKey === referenceDateKey;
          const isFuture = day.dateKey > referenceDateKey;
          const label = day.date
            ? `${format(day.date, 'EEEE d MMMM', { locale: fr })} : ${isDone ? `${day.count} exercice${day.count > 1 ? 's' : ''}` : isFuture ? 'à venir' : 'aucun exercice'}`
            : '';
          const round = (
            <span
              className={clsx(
                'mx-auto flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold tabular-nums',
                isDone ? 'bg-emerald-500 text-emerald-950' : isFuture ? 'border-2 border-dashed border-gray-200 text-gray-300' : 'bg-gray-100 text-gray-400',
                isCurrent && 'ring-2 ring-emerald-500 ring-offset-2'
              )}
            >
              {day.date ? format(day.date, 'd') : ''}
            </span>
          );
          return (
            <li key={day.dateKey}>
              {onDayClick && !isFuture ? (
                <button type="button" onClick={() => onDayClick(day)} aria-label={label} className="w-full rounded-full active:scale-95 transition-transform">
                  {round}
                </button>
              ) : (
                <span aria-label={label} className="block">{round}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
