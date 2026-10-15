'use client';

import clsx from 'clsx';
import { useCountdown } from '../hooks/useCountdown';
import { formatSeconds } from '../utils/seance.utils';

const PRESETS_SECONDS = [30, 60, 120];

type Props = {
  /** Duration read from the exercise; null → the user picks a preset. */
  durationSeconds: number | null;
  onStart: () => void;
  onEnd: () => void;
};

export function SeanceTimer({ durationSeconds, onStart, onEnd }: Props) {
  const initial = durationSeconds ?? PRESETS_SECONDS[0];
  const { remaining, isRunning, start, pause, reset } = useCountdown(initial, onEnd);
  const isFinished = remaining === 0;

  const handleToggle = () => {
    if (isRunning) {
      pause();
      return;
    }
    onStart();
    start();
  };

  return (
    <section aria-label="Minuteur" className="rounded-2xl bg-slate-900 text-white p-4">
      <p
        className={clsx(
          'text-center font-semibold tabular-nums leading-none text-6xl',
          isFinished && 'text-emerald-400'
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {isFinished ? 'Terminé\u00a0!' : formatSeconds(remaining)}
      </p>

      {durationSeconds === null && !isRunning && (
        <div className="mt-4 flex justify-center gap-2" role="group" aria-label="Durée du minuteur">
          {PRESETS_SECONDS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => reset(seconds)}
              className="min-h-[44px] px-4 rounded-full bg-white/10 text-white text-base font-medium active:scale-[0.97]"
            >
              {seconds < 60 ? `${seconds} s` : `${seconds / 60} min`}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className={clsx(
            'flex-1 min-h-[64px] rounded-xl text-xl font-semibold active:scale-[0.98] transition-colors',
            isRunning ? 'bg-amber-400 text-slate-900' : 'bg-white text-slate-900'
          )}
        >
          {isRunning ? 'Pause' : isFinished ? 'Relancer' : 'Démarrer'}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          aria-label="Remettre le minuteur à zéro"
          className="min-h-[64px] px-5 rounded-xl bg-white/10 text-white text-2xl active:scale-[0.97]"
        >
          ↺
        </button>
      </div>
    </section>
  );
}
