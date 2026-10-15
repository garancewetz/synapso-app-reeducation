'use client';

import { useCallback, useState } from 'react';
import clsx from 'clsx';
import type { Exercice } from '@/app/types';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '@/app/constants/exercice.constants';
import { CheckIcon } from '@/app/components/ui/icons';
import { ExerciceMedia } from '@/app/features/exercices/components/ExerciceMedia';
import { useCompleteExercice } from '@/app/features/exercices/hooks/useCompleteExercice';
import { SeanceTimer } from './SeanceTimer';
import { parseCount, parseDurationSeconds } from '../utils/seance.utils';

type Props = {
  exercice: Exercice;
  userId: number;
  onDone: () => void;
  onSkip: () => void;
  onCompleted: (updated: Exercice) => void;
  unlockAudio: () => void;
  signalEnd: () => void;
};

/** One exercise, full screen: everything needed to do it, without any tap to reveal. */
export function SeanceStep({ exercice, userId, onDone, onSkip, onCompleted, unlockAudio, signalEnd }: Props) {
  const { workout, description, category } = exercice;
  const seriesCount = parseCount(workout.series);
  const durationSeconds = parseDurationSeconds(workout.duration);
  const [currentSerie, setCurrentSerie] = useState(1);
  const allSeriesDone = seriesCount !== null && currentSerie > seriesCount;

  const { handleComplete, isCompleting } = useCompleteExercice({ exercice, userId, onCompleted });

  const handleTimerEnd = useCallback(() => {
    signalEnd();
    if (seriesCount !== null) setCurrentSerie((serie) => serie + 1);
  }, [signalEnd, seriesCount]);

  const handleDone = (e: React.MouseEvent) => {
    // The complete endpoint toggles: never call it on an exercise already done today.
    if (!exercice.completedToday) handleComplete(e);
    onDone();
  };

  const workoutChips = [
    seriesCount !== null && `${seriesCount} série${seriesCount > 1 ? 's' : ''}`,
    workout.repeat && `${workout.repeat} répétitions`,
    workout.duration,
  ].filter(Boolean) as string[];

  // Order: what to do (chips) → timer, visible without scrolling on a phone
  // set down nearby → then how to do it (text, photos) for a reminder.
  return (
    <article className="flex flex-col gap-4 pb-32">
      <header className="space-y-3">
        <span className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium', CATEGORY_COLORS[category].tag)}>
          <span aria-hidden="true">{CATEGORY_ICONS[category]}</span>
          {CATEGORY_LABELS[category]}
        </span>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{exercice.name}</h1>
        {workoutChips.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Consignes">
            {workoutChips.map((chip) => (
              <li key={chip} className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-base font-semibold text-slate-800">
                {chip}
              </li>
            ))}
          </ul>
        )}
      </header>

      {seriesCount !== null && seriesCount > 1 && (
        <section aria-label="Séries" className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-4 py-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {allSeriesDone ? 'Toutes les séries sont faites' : `Série ${currentSerie} sur ${seriesCount}`}
            </p>
            <div className="mt-2 flex gap-1.5" aria-hidden="true">
              {Array.from({ length: seriesCount }, (_, i) => (
                <span key={i} className={clsx('h-2.5 w-6 rounded-full', i < currentSerie - 1 ? 'bg-emerald-500' : 'bg-slate-200')} />
              ))}
            </div>
          </div>
          {!allSeriesDone && (
            <button
              type="button"
              onClick={() => setCurrentSerie((serie) => serie + 1)}
              className="min-h-[48px] px-4 rounded-xl bg-slate-100 text-slate-800 font-medium active:scale-[0.97]"
            >
              Série faite
            </button>
          )}
        </section>
      )}

      <SeanceTimer
        key={exercice.id}
        durationSeconds={durationSeconds}
        onStart={unlockAudio}
        onEnd={handleTimerEnd}
      />

      <ExerciceMedia media={exercice.media} maxPhotos={3} title={exercice.name} />

      {description.text && (
        <p className="text-lg text-slate-700 whitespace-pre-line leading-relaxed">{description.text}</p>
      )}
      {description.comment && (
        <p className="p-3 bg-amber-50 border-l-4 border-amber-300 text-slate-800 rounded-r text-base">
          <span className="font-semibold">Conseil : </span>
          {description.comment}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background via-background to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-xl mx-auto flex gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[64px] px-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-base font-medium active:scale-[0.97]"
          >
            Passer
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={isCompleting}
            className={clsx(
              'flex-1 min-h-[64px] rounded-2xl bg-emerald-500 text-white text-xl font-semibold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]',
              allSeriesDone && 'ring-4 ring-emerald-200'
            )}
          >
            <CheckIcon className="w-6 h-6" />
            Fait
          </button>
        </div>
      </div>
    </article>
  );
}
