'use client';

import { useCallback, useState } from 'react';
import clsx from 'clsx';
import type { Exercice } from '@/app/types';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '@/app/constants/exercice.constants';
import { CheckIcon } from '@/app/components/ui/icons';
import { ExerciceMedia } from '@/app/features/exercices/components/ExerciceMedia';
import { useCompleteExercice } from '@/app/features/exercices/hooks/useCompleteExercice';
import { SeanceTimer } from './SeanceTimer';
import { parseCount, parseDurationSeconds, splitRange } from '../utils/seance.utils';

type Props = {
  exercice: Exercice;
  userId: number;
  /** Primary button on the dominant hand's side, closest to the thumb. */
  isLeftHanded: boolean;
  onDone: () => void;
  onSkip: () => void;
  onCompleted: (updated: Exercice) => void;
  unlockAudio: () => void;
  signalEnd: () => void;
};

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

/**
 * What to do, without a decision: a range ("10-20") shows its lower bound, the
 * upper one becomes an optional hint ("jusqu'à 20 si ça va").
 */
function describeWorkout(workout: Exercice['workout']) {
  const chips: string[] = [];
  const hints: string[] = [];
  const series = splitRange(workout.series);
  const seriesCount = series ? series.min : parseCount(workout.series);
  if (seriesCount !== null) chips.push(plural(seriesCount, 'série'));
  if (series) hints.push(plural(series.max, 'série'));

  const repeat = splitRange(workout.repeat);
  if (repeat) {
    chips.push(`${repeat.min} répétitions`);
    hints.push(`${repeat.max} répétitions`);
  } else if (workout.repeat) {
    chips.push(`${workout.repeat} répétitions`);
  }

  const duration = splitRange(workout.duration);
  if (duration) {
    chips.push(`${duration.min}${duration.unit}`);
    hints.push(`${duration.max}${duration.unit}`);
  } else if (workout.duration) {
    chips.push(workout.duration);
  }
  return { chips, hint: hints.length > 0 ? `Jusqu’à ${hints.join(', ')} si ça va.` : null, seriesCount };
}

/** One exercise, full screen: everything needed to do it, without any tap to reveal. */
export function SeanceStep({ exercice, userId, isLeftHanded, onDone, onSkip, onCompleted, unlockAudio, signalEnd }: Props) {
  const { workout, description, category } = exercice;
  const { chips, hint, seriesCount } = describeWorkout(workout);
  const durationSeconds = parseDurationSeconds(workout.duration);
  const [currentSerie, setCurrentSerie] = useState(1);
  // Repetition exercises don't need a timer: it stays folded, one tap away.
  const [timerOpen, setTimerOpen] = useState(durationSeconds !== null);
  const hasSeries = seriesCount !== null && seriesCount > 1;
  const isLastSerie = !hasSeries || currentSerie >= seriesCount;

  const { handleComplete, isCompleting } = useCompleteExercice({ exercice, userId, onCompleted });

  const nextSerie = useCallback(() => {
    setCurrentSerie((serie) => (seriesCount !== null && serie < seriesCount ? serie + 1 : serie));
  }, [seriesCount]);

  const handleTimerEnd = useCallback(() => {
    signalEnd();
    nextSerie();
  }, [signalEnd, nextSerie]);

  // One button for everything: « Série 1 faite », « Série 2 faite »… then « Fait ».
  const handleMain = (e: React.MouseEvent) => {
    if (!isLastSerie) {
      nextSerie();
      return;
    }
    // The complete endpoint toggles: never call it on an exercise already done today.
    if (!exercice.completedToday) handleComplete(e);
    onDone();
  };

  // Order: what to do (chips) → how (text) → timer, all visible without
  // scrolling on a phone set down nearby → then photos and the tip.
  return (
    <article className="flex flex-col gap-4 pb-36">
      <header className="space-y-3">
        <span className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium', CATEGORY_COLORS[category].tag)}>
          <span aria-hidden="true">{CATEGORY_ICONS[category]}</span>
          {CATEGORY_LABELS[category]}
        </span>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{exercice.name}</h1>
        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Consignes">
            {chips.map((chip) => (
              <li key={chip} className="rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-lg font-semibold text-slate-900">
                {chip}
              </li>
            ))}
          </ul>
        )}
        {hint && <p className="text-base text-slate-700">{hint}</p>}
      </header>

      {hasSeries && (
        <section aria-label="Séries" className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3">
          <p className="text-lg font-semibold text-slate-900">Série {currentSerie} sur {seriesCount}</p>
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: seriesCount }, (_, i) => (
              <span key={i} className={clsx('h-3 w-7 rounded-full', i < currentSerie - 1 ? 'bg-emerald-500' : 'bg-slate-200')} />
            ))}
          </div>
        </section>
      )}

      {description.text && (
        <p className="text-xl text-slate-900 whitespace-pre-line leading-relaxed">{description.text}</p>
      )}

      {timerOpen ? (
        <SeanceTimer
          key={`${exercice.id}-${currentSerie}`}
          durationSeconds={durationSeconds}
          onStart={unlockAudio}
          onEnd={handleTimerEnd}
        />
      ) : (
        <button
          type="button"
          onClick={() => setTimerOpen(true)}
          className="self-start min-h-[48px] px-4 rounded-xl bg-white border border-slate-300 text-slate-800 text-base font-medium active:scale-[0.97]"
        >
          ⏱ Minuteur
        </button>
      )}

      {description.comment && (
        <p className="p-3 bg-amber-50 border-l-4 border-amber-300 text-slate-900 rounded-r text-lg">
          <span className="font-semibold">Conseil : </span>
          {description.comment}
        </p>
      )}

      <ExerciceMedia media={exercice.media} maxPhotos={3} title={exercice.name} />

      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background via-background to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className={clsx('max-w-xl mx-auto flex gap-2', isLeftHanded && 'flex-row-reverse')}>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[64px] px-4 rounded-2xl bg-white border border-slate-300 text-slate-800 text-base font-medium active:scale-[0.97]"
          >
            Passer
          </button>
          <button
            type="button"
            onClick={handleMain}
            disabled={isCompleting}
            className="flex-1 min-h-[64px] rounded-2xl bg-emerald-500 text-emerald-950 text-xl font-semibold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
          >
            <CheckIcon className="w-6 h-6" />
            {isLastSerie ? 'Fait' : `Série ${currentSerie} faite`}
          </button>
        </div>
      </div>
    </article>
  );
}
