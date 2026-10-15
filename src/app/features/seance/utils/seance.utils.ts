import type { Exercice } from '@/app/types';
import { CATEGORY_ORDER } from '@/app/constants/exercice.constants';

/**
 * Parse the free-text workout duration ("30 secondes", "1 min", "1min30",
 * "1:30", "45s", "2 minutes") into seconds. Returns null when no duration can
 * be read, so the timer falls back to manual presets.
 */
export function parseDurationSeconds(text: string | null | undefined): number | null {
  if (!text) return null;
  const value = text.toLowerCase().replace(',', '.').trim();

  // "1:30" → 90
  const clock = value.match(/^(\d+):(\d{1,2})$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

  // "1min30", "1 min 30 s", "2 minutes", "1.5 min"
  const minutes = value.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?(?![a-z])\s*(\d+)?/);
  if (minutes) {
    const total = Number(minutes[1]) * 60 + (minutes[2] ? Number(minutes[2]) : 0);
    return Math.round(total);
  }

  // "30 secondes", "45s", "30 sec"
  const seconds = value.match(/(\d+)\s*s/);
  if (seconds) return Number(seconds[1]);

  // A bare number in the duration field is read as seconds.
  const bare = value.match(/^(\d+)$/);
  if (bare) return Number(bare[1]);

  return null;
}

/** Parse "3", "3 séries", "x10" into a positive count; null otherwise. */
export function parseCount(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.match(/\d+/);
  if (!match) return null;
  const count = Number(match[0]);
  return count > 0 ? count : null;
}

/** 90 → "1:30", 5 → "0:05" */
export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Exercises left for the current period (day or week, per resetFrequency),
 * in the standard category order so a session follows the body top to bottom.
 */
export function buildSessionQueue(exercices: Exercice[]): Exercice[] {
  return exercices
    .filter((exercice) => !exercice.archived && !exercice.completed)
    .map((exercice, index) => ({ exercice, index }))
    .sort((a, b) => {
      const byCategory =
        CATEGORY_ORDER.indexOf(a.exercice.category) - CATEGORY_ORDER.indexOf(b.exercice.category);
      return byCategory !== 0 ? byCategory : a.index - b.index;
    })
    .map(({ exercice }) => exercice);
}
