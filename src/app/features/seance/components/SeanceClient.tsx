'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/app/constants/exercice.constants';
import type { ExerciceCategory } from '@/app/types/exercice';
import { useUser } from '@/app/contexts/UserContext';
import { useExercices } from '@/app/features/exercices/hooks/useExercices';
import { usePreserveDateParam } from '@/app/features/time-machine/hooks/usePreserveDateParam';
import { CloseIcon } from '@/app/components/ui/icons';
import { SeanceStep } from './SeanceStep';
import { SeanceRest } from './SeanceRest';
import { useHandPreference } from '@/app/hooks/useHandPreference';
import { getRelatedStretching } from '@/app/features/exercices/utils/stretching.utils';
import { useSessionSignals } from '../hooks/useSessionSignals';
import { EXTRA_BATCH_SIZE, SESSION_SIZE, estimateMinutes, filterByEquipment, getTodayPlan, planSession } from '../utils/seance.utils';

export function SeanceClient() {
  const { effectiveUser } = useUser();
  // Same query as the home (includeArchived: true) → served instantly from the
  // persisted cache; buildSessionQueue drops archived exercises.
  const { exercices: allExercices, loading, updateExercice } = useExercices({ includeArchived: true });
  // Scoped sessions keep the daily dose (fatigue: 5, then « Encore un peu ? »):
  // - ?category=CORE (zone page): the zone, then its related stretches —
  //   STRETCHING comes last in the body order, so planSession puts them at the end;
  // - ?equipments=Lit/Tapis[,Chaise][&sansMateriel=1] (equipment page).
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category')?.toUpperCase() as ExerciceCategory | undefined;
  const zone = categoryParam && CATEGORY_ORDER.includes(categoryParam) ? categoryParam : null;
  const equipmentsParam = searchParams.get('equipments');
  const includeNoEquipment = searchParams.get('sansMateriel') === '1';
  const equipments = useMemo(
    () => (equipmentsParam ? equipmentsParam.split(',').map((eq) => eq.trim()).filter(Boolean) : []),
    [equipmentsParam]
  );
  const scopeLabel = zone
    ? CATEGORY_LABELS[zone]
    : equipments.length > 0
      ? equipments.join(', ') + (includeNoEquipment ? ' + sans matériel' : '')
      : null;
  const exercices = useMemo(() => {
    if (zone) {
      return [
        ...allExercices.filter((exercice) => exercice.category === zone),
        ...getRelatedStretching(allExercices, zone),
      ];
    }
    if (equipments.length > 0) return filterByEquipment(allExercices, equipments, includeNoEquipment);
    return allExercices;
  }, [allExercices, zone, equipments, includeNoEquipment]);
  const preserveDate = usePreserveDateParam();
  const homeHref = preserveDate('/');
  const { unlockAudio, signalEnd } = useSessionSignals();
  const { isLeftHanded } = useHandPreference();
  const router = useRouter();
  // « J'arrête là »: stopping early is a valid ending, not a failure.
  const [stopped, setStopped] = useState(false);
  const [resting, setResting] = useState(false);

  // Snapshot of the session order, taken once: completing an exercise must not
  // reshuffle what comes next. `target` = how many exercises the session aims
  // for: what is left of today's dose (or a small batch when opened from "En faire
  // plus"), grown by "Encore un peu ?" batches. null until the list is known.
  const [queue, setQueue] = useState<number[] | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [position, setPosition] = useState(0);
  const [doneIds, setDoneIds] = useState<number[]>([]);
  const doneCount = doneIds.length;
  const [skipped, setSkipped] = useState<number[]>([]);

  // doneIds: a just-validated exercise stays pending in the cache until the
  // server answers — it must never be planned again.
  const knownIds = useMemo(
    () => new Set([...(queue ?? []), ...skipped, ...doneIds]),
    [queue, skipped, doneIds]
  );

  useEffect(() => {
    if (!effectiveUser || loading || target !== null) return;
    if (scopeLabel) {
      setTarget(Math.max(1, Math.min(SESSION_SIZE, exercices.filter((exercice) => !exercice.archived && !exercice.completed).length)));
      return;
    }
    const { remainingToday } = getTodayPlan(exercices);
    setTarget(remainingToday > 0 ? remainingToday : EXTRA_BATCH_SIZE);
  }, [effectiveUser, loading, exercices, target, scopeLabel]);

  useEffect(() => {
    if (!effectiveUser || loading || target === null) return;
    // The first snapshot may come from the persisted cache (instant start). If the
    // background refetch shows the session is short of its target (exercises added
    // meanwhile, e.g. on another device), top it up at the end — what is already
    // shown never moves.
    setQueue((current) => {
      if (current === null) return planSession(exercices, target).map((exercice) => exercice.id);
      if (current.length >= target) return current;
      const extra = planSession(exercices, target - current.length, knownIds);
      return extra.length > 0 ? [...current, ...extra.map((exercice) => exercice.id)] : current;
    });
  }, [effectiveUser, loading, exercices, target, knownIds]);

  // What "Encore un peu ?" would add: computed on fresh data, never pressuring.
  const extraBatch = useMemo(
    () => (queue === null ? [] : planSession(exercices, EXTRA_BATCH_SIZE, knownIds)),
    [queue, exercices, knownIds]
  );

  // Always render the freshest copy (completedToday may change after a refetch);
  // drop exercises archived or deleted meanwhile.
  const byId = useMemo(() => new Map(exercices.map((exercice) => [exercice.id, exercice])), [exercices]);
  const steps = useMemo(
    () => (queue ?? []).filter((id) => byId.get(id) && !byId.get(id)?.archived),
    [queue, byId]
  );
  const current = !stopped && position < steps.length ? byId.get(steps[position]) : undefined;

  // Mid-session with something done: show « C'est déjà bien ». Otherwise just leave.
  const stop = () => {
    if (current && doneCount > 0) setStopped(true);
    else router.push(homeHref);
  };

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

  // Both continue from where we are: the next items are appended after `position`.
  const appendToSession = (ids: number[]) => {
    setQueue((current) => [...(current ?? []), ...ids]);
    setTarget((t) => Math.max(t ?? 0, (queue?.length ?? 0) + ids.length));
  };

  const resumeSkipped = () => {
    setSkipped([]);
    appendToSession(skipped);
  };

  const doMore = () => appendToSession(extraBatch.map((exercice) => exercice.id));

  return (
    <div className="min-h-dvh max-w-xl mx-auto px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={stop}
          aria-label="Arrêter la séance"
          className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
        {current && (
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">
              {scopeLabel && `${scopeLabel} · `}Exercice {position + 1} sur {steps.length}
            </p>
            <div className="mt-1 h-2 rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
              <div
                className="h-full bg-emerald-500 transition-[width] duration-300"
                style={{ width: `${(position / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}
        {current && position > 0 && (
          <button
            type="button"
            onClick={() => setResting(true)}
            className="min-h-[48px] px-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold"
          >
            🌿 Souffler
          </button>
        )}
      </div>

      {queue === null || !effectiveUser ? (
        <p className="py-16 text-center text-lg text-slate-500" role="status">Préparation de ta séance…</p>
      ) : current ? (
        <SeanceStep
          key={current.id}
          exercice={current}
          userId={effectiveUser.id}
          isLeftHanded={isLeftHanded}
          onDone={handleDone}
          onSkip={handleSkip}
          onCompleted={updateExercice}
          unlockAudio={unlockAudio}
          signalEnd={signalEnd}
        />
      ) : (
        <section className="py-12 text-center space-y-4">
          {/* Three endings: done some (bravo), skipped everything (no guilt, resume
              later), nothing was left to do. */}
          <p className="text-6xl" aria-hidden="true">{stopped ? '🌿' : doneCount > 0 ? '🎉' : skipped.length > 0 ? '🌿' : '✨'}</p>
          <h1 className="text-3xl font-bold text-slate-900">
            {stopped
              ? 'C’est déjà bien\u00a0!'
              : doneCount > 0
              ? 'Séance terminée, bravo\u00a0!'
              : skipped.length > 0
                ? 'Pas de souci'
                : 'Tout est déjà fait'}
          </h1>
          <p className="text-lg text-slate-600">
            {stopped
              ? `${doneCount} exercice${doneCount > 1 ? 's' : ''} fait${doneCount > 1 ? 's' : ''}. Le reste attendra, écoute ta fatigue.`
              : doneCount > 0
              ? `${doneCount} exercice${doneCount > 1 ? 's' : ''} fait${doneCount > 1 ? 's' : ''}.`
              : skipped.length > 0
                ? 'Tu peux reprendre les exercices passés maintenant, ou plus tard.'
                : 'Aucun exercice ne t’attend pour le moment.'}
          </p>
          {/* Finishing is the success, not a debt: "Terminer" is the main action,
              doing more is an open door. */}
          <div className="flex flex-col gap-3 pt-4">
            <Link
              href={homeHref}
              className="w-full min-h-[56px] rounded-2xl bg-slate-900 text-white! text-lg font-semibold flex items-center justify-center"
            >
              {doneCount > 0 ? 'Terminer pour aujourd’hui' : 'Retour à l’accueil'}
            </Link>
            {!stopped && skipped.length > 0 && (
              <button
                type="button"
                onClick={resumeSkipped}
                className="w-full min-h-[56px] rounded-2xl bg-white border border-slate-200 text-slate-800 text-lg font-semibold"
              >
                Reprendre {skipped.length > 1 ? `les ${skipped.length} exercices passés` : 'l’exercice passé'}
              </button>
            )}
            {!stopped && extraBatch.length > 0 && (
              <button
                type="button"
                onClick={doMore}
                className="w-full min-h-[56px] rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-lg font-semibold"
              >
                Encore un peu ? {extraBatch.length} exercice{extraBatch.length > 1 ? 's' : ''} · ~{estimateMinutes(extraBatch)} min
              </button>
            )}
          </div>
        </section>
      )}
      {resting && <SeanceRest onClose={() => setResting(false)} signalEnd={signalEnd} />}
    </div>
  );
}
