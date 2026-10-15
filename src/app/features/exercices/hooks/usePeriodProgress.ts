'use client';

import { useMemo } from 'react';
import { useExercices } from './useExercices';

export type PeriodProgress = {
  done: number;
  total: number;
};

/**
 * Progress over the user's period (today or this week, per resetFrequency):
 * active exercises done / active exercises. Same list as the home and the
 * session (includeArchived: true → persisted, instant), so every counter agrees.
 * null while the list is not loaded yet.
 */
export function usePeriodProgress(): PeriodProgress | null {
  const { exercices, loading } = useExercices({ includeArchived: true });

  return useMemo(() => {
    if (loading) return null;
    const active = exercices.filter((exercice) => !exercice.archived);
    return {
      done: active.filter((exercice) => exercice.completed).length,
      total: active.length,
    };
  }, [exercices, loading]);
}
