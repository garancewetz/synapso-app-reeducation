'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/app/contexts/UserContext';
import { useExercices } from '@/app/features/exercices/hooks/useExercices';
import { usePreserveDateParam } from '@/app/features/time-machine/hooks/usePreserveDateParam';
import { estimateMinutes, getTodayPlan, planSession } from '../utils/seance.utils';

/** Home entry point: one big button to start the session, above everything else. */
export function SeanceStartCard() {
  const { effectiveUser } = useUser();
  const { exercices, loading } = useExercices({ includeArchived: true });
  const preserveDate = usePreserveDateParam();

  // Same plan as the session itself: what is left of today's dose — never "14 to do".
  const { plan, today, total } = useMemo(() => {
    const today = getTodayPlan(exercices);
    return {
      today,
      plan: planSession(exercices, today.remainingToday),
      total: exercices.filter((exercice) => !exercice.archived).length,
    };
  }, [exercices]);

  if (!effectiveUser || loading) {
    return <div className="h-[88px] rounded-2xl bg-slate-100 animate-pulse" aria-hidden="true" />;
  }
  if (total === 0) return null;

  const period = effectiveUser.resetFrequency === 'WEEKLY' ? 'cette semaine' : "aujourd'hui";

  if (today.pending > 0 && today.remainingToday === 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4">
        <p className="text-lg font-medium text-emerald-800">✅ Séance du jour faite, bravo&nbsp;!</p>
        <Link
          href={preserveDate('/seance')}
          className="shrink-0 min-h-[44px] flex items-center px-3 rounded-xl text-base font-semibold text-emerald-700! underline underline-offset-4"
        >
          En faire plus
        </Link>
      </div>
    );
  }

  if (plan.length === 0) {
    return (
      <p className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-lg font-medium text-emerald-800">
        🎉 Tous tes exercices sont faits {period}.
      </p>
    );
  }

  return (
    <Link
      href={preserveDate('/seance')}
      className="flex items-center gap-4 rounded-2xl bg-emerald-500 px-5 py-4 text-emerald-950! shadow-lg active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/30 text-2xl" aria-hidden="true">
        ▶
      </span>
      <span>
        <span className="block text-xl font-semibold">Commencer ma séance</span>
        <span className="block text-base text-emerald-900">
          {plan.length} exercice{plan.length > 1 ? 's' : ''} · environ {estimateMinutes(plan)} min
        </span>
      </span>
    </Link>
  );
}
