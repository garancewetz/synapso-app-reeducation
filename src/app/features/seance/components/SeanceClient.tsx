'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/app/contexts/UserContext';
import { useExercices } from '@/app/features/exercices/hooks/useExercices';
import { usePreserveDateParam } from '@/app/features/time-machine/hooks/usePreserveDateParam';
import { CloseIcon } from '@/app/components/ui/icons';
import { SeanceStep } from './SeanceStep';
import { useSessionSignals } from '../hooks/useSessionSignals';
import { buildSessionQueue } from '../utils/seance.utils';

export function SeanceClient() {
  const { effectiveUser } = useUser();
  // Same query as the home (includeArchived: true) → served instantly from the
  // persisted cache; buildSessionQueue drops archived exercises.
  const { exercices, loading, updateExercice } = useExercices({ includeArchived: true });
  const preserveDate = usePreserveDateParam();
  const homeHref = preserveDate('/');
  const { unlockAudio, signalEnd } = useSessionSignals();

  // Snapshot of the session order, taken once: completing an exercise must not
  // reshuffle what comes next.
  const [queue, setQueue] = useState<number[] | null>(null);
  const [position, setPosition] = useState(0);
  const [doneIds, setDoneIds] = useState<number[]>([]);
  const doneCount = doneIds.length;
  const [skipped, setSkipped] = useState<number[]>([]);

  useEffect(() => {
    if (!effectiveUser || loading) return;
    const pendingIds = buildSessionQueue(exercices).map((exercice) => exercice.id);
    // The first snapshot may come from the persisted cache (instant start); when the
    // background refetch brings exercises added meanwhile (e.g. on another device),
    // append them instead of rebuilding — the order already shown must not move.
    setQueue((current) => {
      if (current === null) return pendingIds;
      // doneIds: a just-validated exercise stays pending in the cache until the
      // server answers — it must not come back.
      const known = new Set([...current, ...skipped, ...doneIds]);
      const added = pendingIds.filter((id) => !known.has(id));
      return added.length > 0 ? [...current, ...added] : current;
    });
  }, [effectiveUser, loading, exercices, skipped, doneIds]);

  // Always render the freshest copy (completedToday may change after a refetch);
  // drop exercises archived or deleted meanwhile.
  const byId = useMemo(() => new Map(exercices.map((exercice) => [exercice.id, exercice])), [exercices]);
  const steps = useMemo(
    () => (queue ?? []).filter((id) => byId.get(id) && !byId.get(id)?.archived),
    [queue, byId]
  );
  const current = position < steps.length ? byId.get(steps[position]) : undefined;

  const next = () => {
    setPosition((p) => p + 1);
    window.scrollTo({ top: 0 });
  };

  const handleDone = () => {
    if (current) setDoneIds((ids) => [...ids, current.id]);
    next();
  };

  const handleSkip = () => {
    if (current) setSkipped((ids) => [...ids, current.id]);
    next();
  };

  const resumeSkipped = () => {
    setQueue(skipped);
    setSkipped([]);
    setPosition(0);
  };

  return (
    <div className="min-h-dvh max-w-xl mx-auto px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3 py-3">
        <Link
          href={homeHref}
          aria-label="Quitter la séance"
          className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700"
        >
          <CloseIcon className="w-5 h-5" />
        </Link>
        {current && (
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600">
              Exercice {position + 1} sur {steps.length}
            </p>
            <div className="mt-1 h-2 rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
              <div
                className="h-full bg-emerald-500 transition-[width] duration-300"
                style={{ width: `${(position / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {queue === null || !effectiveUser ? (
        <p className="py-16 text-center text-lg text-slate-500" role="status">Préparation de ta séance…</p>
      ) : current ? (
        <SeanceStep
          key={current.id}
          exercice={current}
          userId={effectiveUser.id}
          onDone={handleDone}
          onSkip={handleSkip}
          onCompleted={updateExercice}
          unlockAudio={unlockAudio}
          signalEnd={signalEnd}
        />
      ) : (
        <section className="py-12 text-center space-y-4">
          <p className="text-6xl" aria-hidden="true">{doneCount > 0 ? '🎉' : '✨'}</p>
          <h1 className="text-3xl font-bold text-slate-900">
            {doneCount > 0 ? 'Séance terminée, bravo\u00a0!' : 'Tout est déjà fait'}
          </h1>
          <p className="text-lg text-slate-600">
            {doneCount > 0
              ? `${doneCount} exercice${doneCount > 1 ? 's' : ''} fait${doneCount > 1 ? 's' : ''}.`
              : 'Aucun exercice ne t’attend pour le moment.'}
          </p>
          <div className="flex flex-col gap-3 pt-4">
            {skipped.length > 0 && (
              <button
                type="button"
                onClick={resumeSkipped}
                className="w-full min-h-[56px] rounded-2xl bg-slate-900 text-white text-lg font-semibold"
              >
                Reprendre les {skipped.length} exercice{skipped.length > 1 ? 's' : ''} passé{skipped.length > 1 ? 's' : ''}
              </button>
            )}
            <Link
              href={homeHref}
              className="w-full min-h-[56px] rounded-2xl bg-white border border-slate-200 text-slate-800 text-lg font-semibold flex items-center justify-center"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
