'use client';

import { memo, useMemo } from 'react';
import { TouchLink } from '@/app/components/TouchLink';
import { usePreserveDateParam } from '@/app/features/time-machine';
import type { Exercice } from '@/app/types/exercice';
import { HomeCategoryList } from './HomeCategoryList';

type Props = {
  exercices: Exercice[];
  archivedCount: number;
  error?: Error | null;
  loading?: boolean;
};

export const HomeExercicesTab = memo(function HomeExercicesTab({
  exercices,
  archivedCount,
  error,
  loading = false,
}: Props) {
  const preserveDate = usePreserveDateParam();
  const activeExercices = useMemo(() => exercices.filter(exercice => !exercice.archived), [exercices]);
  const hasAnyActiveExercice = activeExercices.length > 0;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Impossible de charger les exercices. Tirez vers le bas pour réessayer.
        </div>
      )}
      {!loading && !error && !hasAnyActiveExercice && (
        <p>
          Commencez par ajouter vos exercices. Les zones du corps ci-dessous vous aident à les ranger.
        </p>
      )}
      <HomeCategoryList exercices={activeExercices} loading={loading} />
      {/* Management tools, not daily needs: kept discreet. */}
      <nav aria-label="Autres vues" className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-1 text-sm">
        <TouchLink href={preserveDate('/exercices/all')} className="py-2 font-medium text-gray-500 underline-offset-4 md:hover:underline">
          Par équipement
        </TouchLink>
        {archivedCount > 0 && (
          <TouchLink href={preserveDate('/exercices/archived')} className="py-2 font-medium text-gray-500 underline-offset-4 md:hover:underline">
            Archivés ({archivedCount})
          </TouchLink>
        )}
      </nav>
    </div>
  );
});
