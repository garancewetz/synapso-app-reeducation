'use client';

import { useMemo } from 'react';
import { useExercices } from '@/app/features/exercices';
import { HomeCategoryList } from '@/app/features/home/components/HomeCategoryList';
import { useLayoutContext } from '@/app/contexts/LayoutContext';
import { Button } from '@/app/components/ui/Button';
import { CloseIcon } from '@/app/components/ui/icons';

export function CategoriesFullOverlay() {
  const { categoriesOverlayOpen, setCategoriesOverlayOpen } = useLayoutContext();
  // Same list and counters as the home (includeArchived: true, persisted).
  const { exercices, loading } = useExercices({ includeArchived: true });
  const activeExercices = useMemo(() => exercices.filter((e) => !e.archived), [exercices]);

  if (!categoriesOverlayOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="Choisir une catégorie"
    >
      <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Catégories</h2>
        <Button
          type="button"
          iconOnly
          onClick={() => setCategoriesOverlayOpen(false)}
          className="!p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
          aria-label="Fermer"
        >
          <CloseIcon className="w-6 h-6" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Close as soon as a zone is picked (the overlay lives above the pages). */}
        <div
          className="max-w-2xl mx-auto"
          onClickCapture={(e) => {
            if ((e.target as HTMLElement).closest('a')) setCategoriesOverlayOpen(false);
          }}
        >
          <HomeCategoryList exercices={activeExercices} loading={loading} />
        </div>
      </div>
    </div>
  );
}
