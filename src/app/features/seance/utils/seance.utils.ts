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

/** A daily session stays short and doable: a done session beats an abandoned one. */
export const SESSION_SIZE = 5;
/** "Encore un peu ?" batch at the end of a session. */
export const EXTRA_BATCH_SIZE = 3;

const byBodyOrder = (a: Exercice, b: Exercice) =>
  CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);

/**
 * Exercises left for the current period (day or week, per resetFrequency),
 * in the standard category order so a session follows the body top to bottom.
 */
export function buildSessionQueue(exercices: Exercice[]): Exercice[] {
  return exercices
    .filter((exercice) => !exercice.archived && !exercice.completed)
    .map((exercice, index) => ({ exercice, index }))
    .sort((a, b) => byBodyOrder(a.exercice, b.exercice) || a.index - b.index)
    .map(({ exercice }) => exercice);
}

/**
 * Today's dose: a full session, or less when fewer exercises are left in the
 * period (counting what was already done today). Daily rhythm → min(5, total);
 * weekly → shrinks as the week's list gets done.
 */
export function getTodayPlan(exercices: Exercice[]) {
  const active = exercices.filter((exercice) => !exercice.archived);
  const doneToday = active.filter((exercice) => exercice.completedToday).length;
  const pending = active.filter((exercice) => !exercice.completed).length;
  const dose = Math.min(SESSION_SIZE, pending + doneToday);
  return { dose, doneToday, remainingToday: Math.max(0, dose - doneToday), pending };
}

const lastDoneTime = (exercice: Exercice) =>
  exercice.completedAt ? new Date(exercice.completedAt).getTime() : 0;

/**
 * Picks at most `size` pending exercises for today's session:
 * pinned first, then the least recently done (never done = most urgent),
 * alternating body zones so a short session still works the whole body.
 * Returned in body order for a natural flow. `excludeIds`: already planned.
 */
export function planSession(
  exercices: Exercice[],
  size: number,
  excludeIds: ReadonlySet<number> = new Set()
): Exercice[] {
  const pending = buildSessionQueue(exercices).filter((exercice) => !excludeIds.has(exercice.id));
  const byPriority = [...pending].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || lastDoneTime(a) - lastDoneTime(b)
  );

  const picked: Exercice[] = byPriority.filter((exercice) => exercice.pinned).slice(0, size);
  const rest = byPriority.filter((exercice) => !exercice.pinned);
  // Round-robin over zones: take from the zone least present so far; within a
  // zone (and on ties) `rest` is already ordered most overdue first.
  while (picked.length < size && rest.length > 0) {
    const inPick = (category: Exercice['category']) =>
      picked.filter((exercice) => exercice.category === category).length;
    let bestIndex = 0;
    rest.forEach((exercice, index) => {
      if (inPick(exercice.category) < inPick(rest[bestIndex].category)) bestIndex = index;
    });
    picked.push(...rest.splice(bestIndex, 1));
  }

  return picked.sort(byBodyOrder);
}

const SECONDS_PER_REPETITION = 4;
const DEFAULT_REPETITIONS = 10;
const REST_BETWEEN_SERIES_SECONDS = 30;
const TRANSITION_SECONDS = 20;

/** Rough duration of a list of exercises, in whole minutes (at least 1). */
export function estimateMinutes(exercices: Exercice[]): number {
  const seconds = exercices.reduce((total, exercice) => {
    const series = parseCount(exercice.workout.series) ?? 1;
    const perSerie =
      parseDurationSeconds(exercice.workout.duration) ??
      (parseCount(exercice.workout.repeat) ?? DEFAULT_REPETITIONS) * SECONDS_PER_REPETITION;
    return total + series * perSerie + (series - 1) * REST_BETWEEN_SERIES_SECONDS + TRANSITION_SECONDS;
  }, 0);
  return Math.max(1, Math.round(seconds / 60));
}
