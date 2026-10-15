'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ExerciceRow, useExercices, useExerciceHandlers } from '@/app/features/exercices';
import { EmptyState } from '@/app/components/EmptyState';
import { NAVIGATION_EMOJIS } from '@/app/constants/emoji.constants';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_ICONS,
} from '@/app/constants/exercice.constants';
import type { Exercice, ExerciceCategory } from '@/app/types/exercice';

const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.div })),
  { ssr: false, loading: () => null }
);

export function ArchivedPageClient() {
  // Charger tous les exercices (y compris archivés)
  const { exercices, loading: loadingExercices, updateExercice } = useExercices({ includeArchived: true });

  // Filtrer pour ne garder que les exercices archivés
  const archivedExercices = useMemo(() => {
    return exercices.filter(ex => ex.archived === true);
  }, [exercices]);

  const { handleEditClick, handleCompleted } = useExerciceHandlers({
    updateExercice,
    fromPath: '/exercices/archived',
  });

  const handleArchive = (updatedExercice: Exercice) => {
    updateExercice(updatedExercice);
  };

  // Grouper par catégorie
  const exercicesByCategory = useMemo(() => {
    const grouped: Record<ExerciceCategory, Exercice[]> = {
      UPPER_BODY: [],
      LOWER_BODY: [],
      CORE: [],
      STRETCHING: [],
      FACE: [],
    };
    
    archivedExercices.forEach(ex => {
      grouped[ex.category].push(ex);
    });
    
    return grouped;
  }, [archivedExercices]);

  return (
    <section className="pb-12 md:pb-8 min-h-screen">
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto pt-2 md:pt-4 px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Exercices archivés
            </h1>
            {loadingExercices ? (
              <p className="text-gray-500 mt-1">
                <span className="inline-block h-5 w-48 bg-gray-200 rounded animate-pulse" />
              </p>
            ) : (
              <p className="text-gray-500 mt-1">
                {archivedExercices.length} exercice{archivedExercices.length > 1 ? 's' : ''} archivé{archivedExercices.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Exercices */}
        <div>
          {loadingExercices ? (
            <div className="flex items-center justify-center min-h-screen py-12">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : archivedExercices.length === 0 ? (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <EmptyState
                icon={NAVIGATION_EMOJIS.FOLDER_CLOSED}
                title="Aucun exercice archivé"
                message="Les exercices que vous archivez apparaîtront ici. Vous pourrez les désarchiver à tout moment."
              />
            </MotionDiv>
          ) : (
            <div className="space-y-10 md:space-y-8">
              {CATEGORY_ORDER.map((category) => {
                const categoryExercices = exercicesByCategory[category];
                const categoryIcon = CATEGORY_ICONS[category];
                const hasExercices = categoryExercices.length > 0;

                if (!hasExercices) {
                  return null;
                }

                return (
                  <MotionDiv
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="mt-6 mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      <span aria-hidden="true">{categoryIcon}</span>
                      {CATEGORY_LABELS[category]} · {categoryExercices.length}
                    </h2>
                    <ul className="grid gap-2 grid-cols-1 lg:grid-cols-2">
                      {categoryExercices.map((exercice) => (
                        <li key={exercice.id}>
                          <ExerciceRow
                            exercice={exercice}
                            onEdit={handleEditClick}
                            onCompleted={handleCompleted}
                            onArchive={handleArchive}
                          />
                        </li>
                      ))}
                    </ul>
                  </MotionDiv>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
