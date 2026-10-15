import type { Exercice } from '@/app/types';

/** "3 séries · 10× · 30 secondes" — what to do, readable at a glance. */
export function formatWorkoutSummary(workout: Exercice['workout']): string {
  const { series, repeat, duration } = workout;
  return [series && series !== '1' && `${series} séries`, repeat && `${repeat}×`, duration]
    .filter(Boolean)
    .join(' · ');
}
