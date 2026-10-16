'use client';

import clsx from 'clsx';
import { TouchLink } from '@/app/components/TouchLink';
import type { Exercice } from '@/app/types';
import { estimateMinutes } from '../utils/seance.utils';

type Props = {
  href: string;
  /** What the session covers: « Tronc », « Lit/Tapis + sans matériel »… */
  scopeLabel: string;
  /** The exercises the session will offer (already capped to the dose). */
  plan: Exercice[];
  className?: string;
};

/** Big green « Lancer la séance » button of the zone and equipment pages. */
export function SeanceLaunchLink({ href, scopeLabel, plan, className }: Props) {
  return (
    <TouchLink
      href={href}
      className={clsx(
        'flex items-center gap-4 rounded-2xl bg-emerald-500 px-5 py-3.5 text-emerald-950! shadow-md active:scale-[0.98] transition-transform',
        className
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/30 text-xl" aria-hidden="true">▶</span>
      <span>
        <span className="block text-lg font-semibold">Lancer la séance</span>
        <span className="block text-sm text-emerald-900">
          {scopeLabel} · {plan.length} exercice{plan.length > 1 ? 's' : ''} · environ {estimateMinutes(plan)} min
        </span>
      </span>
    </TouchLink>
  );
}
