'use client';

import { useMemo } from 'react';
import type { Exercice } from '@/app/types/exercice';
import { HomeExercicesTab } from '@/app/features/home';
import { useExercices } from '@/app/features/exercices';

type Props = {
  initialExercices?: Exercice[];
};

export function HomeExercicesView({ initialExercices }: Props = {}) {
  const { exercices, loading, error } = useExercices({
    includeArchived: true,
    initialData: initialExercices,
  });
  const archivedCount = useMemo(() => exercices.filter(e => e.archived).length, [exercices]);

  return (
    <HomeExercicesTab
      exercices={exercices}
      archivedCount={archivedCount}
      error={error}
      loading={loading}
    />
  );
}
