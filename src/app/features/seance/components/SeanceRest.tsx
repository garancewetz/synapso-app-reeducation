'use client';

import { useEffect, useRef } from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { formatSeconds } from '../utils/seance.utils';

const REST_SECONDS = 30;

type Props = {
  onClose: () => void;
  signalEnd: () => void;
};

/** Optional breather between two exercises: a calm screen, back on its own after 30 s. */
export function SeanceRest({ onClose, signalEnd }: Props) {
  const { remaining, start } = useCountdown(REST_SECONDS, () => {
    signalEnd();
    onClose();
  });

  // Start once: `start` changes with every tick.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
  }, [start]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pause"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-emerald-50 px-6 text-center"
    >
      <p className="text-6xl" aria-hidden="true">🌿</p>
      <h2 className="text-3xl font-bold text-slate-900">On souffle</h2>
      <p className="text-6xl font-semibold tabular-nums text-emerald-800" aria-live="polite" aria-atomic="true">
        {formatSeconds(remaining)}
      </p>
      <p className="text-lg text-slate-700">Respire tranquillement. La séance reprend toute seule.</p>
      <button
        type="button"
        onClick={onClose}
        className="w-full max-w-sm min-h-[64px] rounded-2xl bg-emerald-500 text-emerald-950 text-xl font-semibold shadow-lg active:scale-[0.98]"
      >
        Reprendre
      </button>
    </div>
  );
}
