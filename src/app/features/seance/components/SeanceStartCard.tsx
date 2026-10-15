'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/app/contexts/UserContext';
import { useExercices } from '@/app/features/exercices/hooks/useExercices';
import { usePreserveDateParam } from '@/app/features/time-machine/hooks/usePreserveDateParam';
import { buildSessionQueue } from '../utils/seance.utils';

/** Home entry point: one big button to start the session, above everything else. */
export function SeanceStartCard() {
  const { effectiveUser } = useUser();
  const { exercices, loading } = useExercices({ includeArchived: true });
  const preserveDate = usePreserveDateParam();

  const { pending, total } = useMemo(() => ({
    pending: buildSessionQueue(exercices).length,
    total: exercices.filter((exercice) => !exercice.archived).length,
  }), [exercices]);

  if (!effectiveUser || loading) {
    return <div className="h-[88px] rounded-2xl bg-slate-100 animate-pulse" aria-hidden="true" />;
  }
  if (total === 0) return null;

  const period = effectiveUser.resetFrequency === 'WEEKLY' ? 'cette semaine' : "aujourd'hui";

  if (pending === 0) {
    return (
      <p className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-lg font-medium text-emerald-800">
        🎉 Tous tes exercices sont faits {period}.
      </p>
    );
  }

  return (
    <Link
      href={preserveDate('/seance')}
      className="flex items-center gap-4 rounded-2xl bg-emerald-500 px-5 py-4 text-white shadow-lg active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl" aria-hidden="true">
        ▶
      </span>
      <span>
        <span className="block text-xl font-semibold">Commencer ma séance</span>
        <span className="block text-base text-emerald-50">
          {pending} exercice{pending > 1 ? 's' : ''} à faire {period}
        </span>
      </span>
    </Link>
  );
}
