'use client';

import { useMemo } from 'react';
import { useUser } from '@/app/contexts/UserContext';
import { getTodayPlan } from '@/app/features/seance/utils/seance.utils';
import { useExercices } from './useExercices';

export type PeriodProgress = {
  done: number;
  total: number;
};

/**
 * Progress shown in the home header, on the same list as the session
 * (includeArchived: true → persisted, instant), so every counter agrees:
 * - daily rhythm: today's dose (a 5-exercise session), never "0 / 14";
 * - weekly rhythm: the whole week's list, which is spread over the week.
 * `done` may exceed `total` (bonus). null while the list is not loaded yet.
 */
export function usePeriodProgress(): PeriodProgress | null {
  const { effectiveUser } = useUser();
  const { exercices, loading } = useExercices({ includeArchived: true });
  const isWeekly = effectiveUser?.resetFrequency === 'WEEKLY';

  return useMemo(() => {
    if (loading) return null;
    if (!isWeekly) {
      const { dose, doneToday } = getTodayPlan(exercices);
      return { done: doneToday, total: dose };
    }
    const active = exercices.filter((exercice) => !exercice.archived);
    return {
      done: active.filter((exercice) => exercice.completed).length,
      total: active.length,
    };
  }, [exercices, loading, isWeekly]);
}
