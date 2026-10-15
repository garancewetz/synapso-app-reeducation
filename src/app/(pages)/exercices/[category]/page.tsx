'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import clsx from 'clsx';
import {
  ExerciceRow,
  useExercices,
  useExerciceStatusFilter,
  useExerciceHandlers,
  useCategoryFilters,
  CategoryBodypartsSection,
  CategoryAffinerSection,
  CategoryActiveFiltersBar,
} from '@/app/features/exercices';
import { EmptyState } from '@/app/components/EmptyState';
import { TouchLink } from '@/app/components/TouchLink';
import { estimateMinutes } from '@/app/features/seance/utils/seance.utils';
import { getRelatedStretching } from '@/app/features/exercices/utils/stretching.utils';
import type { ExerciceCategory, ExerciceStatusFilter, Exercice } from '@/app/types/exercice';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/app/constants/exercice.constants';

// Below this many exercises, the body-part / equipment filters stay hidden.
const FILTERS_THRESHOLD = 8;

const HIGHLIGHT_RING_BY_CATEGORY: Record<ExerciceCategory, string> = {
  UPPER_BODY: 'ring-2 ring-orange-500',
  CORE: 'ring-2 ring-teal-500',
  LOWER_BODY: 'ring-2 ring-blue-500',
  STRETCHING: 'ring-2 ring-purple-500',
  FACE: 'ring-2 ring-amber-500',
};
import { NAVIGATION_EMOJIS } from '@/app/constants/emoji.constants';
import { useLayoutContext } from '@/app/contexts/LayoutContext';
import { useHandPreference } from '@/app/hooks/useHandPreference';

function getHighlightedExerciceIdFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash.startsWith('#exercice-')) return null;
  return hash.slice('#exercice-'.length);
}

export default function CategoryPage() {
  const [filter, setFilter] = useState<ExerciceStatusFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { preserveDate } = useLayoutContext();
  const { isLeftHanded } = useHandPreference();

  const categoryParam = useMemo(() => {
    return (params.category as string)?.toUpperCase() as ExerciceCategory;
  }, [params.category]);

  const isValidCategory = useMemo(() => CATEGORY_ORDER.includes(categoryParam), [categoryParam]);

  const { exercices, loading: loadingExercices, error: exercicesError, refetch: refetchExercices, updateExercice } = useExercices({
    category: params.category && isValidCategory ? categoryParam : undefined,
  });

  const { exercices: stretchingExercices, updateExercice: updateStretchingExercice } = useExercices({
    category:
      params.category && categoryParam !== 'STRETCHING' ? 'STRETCHING' : undefined,
  });

  useEffect(() => {
    if (params.category && !isValidCategory) {
      router.push('/');
    }
  }, [params.category, isValidCategory, router]);

  const { filteredExercices: baseFilteredExercices, completedCount } = useExerciceStatusFilter({
    exercices,
    filter,
  });

  const filters = useCategoryFilters({
    exercices,
    stretchingExercices,
    baseFilteredExercices,
    categoryParam,
    filter,
  });

  const handleCompleted = useCallback(
    (updatedExercice: Exercice) => {
      updateExercice(updatedExercice);
      if (updatedExercice.category === 'STRETCHING') {
        updateStretchingExercice(updatedExercice);
      }
    },
    [updateExercice, updateStretchingExercice]
  );

  const { handleEditClick } = useExerciceHandlers({ updateExercice });

  const onRemoveStatusFilter = useCallback(() => setFilter('all'), []);
  const onRemoveBodypart = useCallback(
    (value: string) =>
      filters.setSelectedBodyparts((prev) => prev.filter((bp) => bp !== value)),
    [filters]
  );
  const onRemoveEquipment = useCallback(
    (value: string) =>
      filters.setSelectedEquipments((prev) => prev.filter((eq) => eq !== value)),
    [filters]
  );
  const onResetAll = useCallback(() => {
    setFilter('all');
    filters.handleResetAllFilters();
  }, [filters]);

  const handleArchive = useCallback(
    (updatedExercice: Exercice) => {
      updateExercice(updatedExercice);
    },
    [updateExercice]
  );

  const hasScrolledToHashRef = useRef(false);
  const [highlightedExerciceId, setHighlightedExerciceId] = useState<string | null>(null);

  useEffect(() => {
    const id = getHighlightedExerciceIdFromHash();
    if (!id) return;
    setHighlightedExerciceId(id);
    const timeout = setTimeout(() => setHighlightedExerciceId(null), 4000);
    return () => clearTimeout(timeout);
  }, [loadingExercices]);

  useEffect(() => {
    if (loadingExercices || hasScrolledToHashRef.current) return;
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash.startsWith('#exercice-')) return;
    const id = hash.slice('#exercice-'.length);
    const el = document.getElementById(`exercice-${id}`);
    if (el) {
      hasScrolledToHashRef.current = true;
      const t = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [loadingExercices]);

  if (params.category && !isValidCategory) {
    return null;
  }

  if (!params.category) {
    return (
      <section className="pb-12 md:pb-8">
        <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto pt-2 md:pt-4 px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Chargement...</div>
          </div>
        </div>
      </section>
    );
  }

  const todoExercices = filters.filteredExercices.filter((exercice) => !exercice.completed);
  const doneExercices = filters.filteredExercices.filter((exercice) => exercice.completed);
  const pendingInCategory = exercices.filter((exercice) => !exercice.completed);
  // The zone session ends with these (same rule as « Étirements conseillés »).
  const pendingStretches = getRelatedStretching(stretchingExercices, categoryParam).filter(
    (exercice) => !exercice.completed
  );
  const sessionPlan = [...pendingInCategory, ...pendingStretches];
  // Filters only help with a long list: below this, reading beats filtering.
  const showFilters = exercices.length > FILTERS_THRESHOLD;
  const label = CATEGORY_LABELS[categoryParam];

  const renderRows = (list: Exercice[]) => (
    <ul className="grid gap-2 grid-cols-1 lg:grid-cols-2">
      {list.map((exercice) => (
        <li
          key={exercice.id}
          id={`exercice-${exercice.id}`}
          className={clsx(
            'scroll-mt-24 rounded-xl transition-shadow duration-300',
            highlightedExerciceId === String(exercice.id) &&
              `${HIGHLIGHT_RING_BY_CATEGORY[exercice.category]} ring-offset-2 ring-offset-background shadow-lg`
          )}
        >
          <ExerciceRow
            exercice={exercice}
            onEdit={handleEditClick}
            onCompleted={handleCompleted}
            onArchive={handleArchive}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <section className="pb-40 md:pb-8" aria-live="polite" aria-busy={loadingExercices}>
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto pt-2 md:pt-4 px-4 md:px-6 lg:px-8">
        {exercicesError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>Impossible de charger les exercices.</span>
            <button
              type="button"
              onClick={() => refetchExercices()}
              className="font-medium text-red-800 underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
            >
              Réessayer
            </button>
          </div>
        )}

        <header className={clsx('flex items-baseline justify-between gap-3', isLeftHanded && 'flex-row-reverse')}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{label}</h1>
          {loadingExercices ? (
            <span className="inline-block h-5 w-24 bg-gray-200 rounded animate-pulse" />
          ) : exercices.length > 0 ? (
            <p className="text-base font-medium text-gray-600 shrink-0">
              {completedCount} fait{completedCount > 1 ? 's' : ''} sur {exercices.length}
            </p>
          ) : null}
        </header>

        {/* Bridge to the session: do this zone now, with the timer. */}
        {!loadingExercices && sessionPlan.length > 0 && (
          <TouchLink
            href={preserveDate(`/seance?category=${categoryParam}`)}
            className="mt-4 flex items-center gap-4 rounded-2xl bg-emerald-500 px-5 py-3.5 text-emerald-950! shadow-md active:scale-[0.98] transition-transform"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/30 text-xl" aria-hidden="true">▶</span>
            <span>
              <span className="block text-lg font-semibold">Lancer la séance</span>
              <span className="block text-sm text-emerald-900">
                {[
                  label,
                  pendingInCategory.length > 0 &&
                    `${pendingInCategory.length} exercice${pendingInCategory.length > 1 ? 's' : ''}` +
                      (pendingStretches.length > 0 ? ` + ${pendingStretches.length} étirement${pendingStretches.length > 1 ? 's' : ''}` : ''),
                  pendingInCategory.length === 0 &&
                    `${pendingStretches.length} étirement${pendingStretches.length > 1 ? 's' : ''}`,
                  `environ ${estimateMinutes(sessionPlan)} min`,
                ].filter(Boolean).join(' · ')}
              </span>
            </span>
          </TouchLink>
        )}


        {showFilters && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className="text-sm font-medium text-gray-600 underline underline-offset-4 py-2"
            >
              {filtersOpen ? 'Masquer les filtres' : 'Filtrer par partie du corps ou équipement'}
            </button>
            {filtersOpen && (
              <div className="mt-2 space-y-4">
                <CategoryBodypartsSection
                  categoryParam={categoryParam}
                  bodypartsWithCounts={filters.bodypartsWithCounts}
                  selectedBodyparts={filters.selectedBodyparts}
                  setSelectedBodyparts={filters.setSelectedBodyparts}
                  isAllBodypartsSelected={filters.isAllBodypartsSelected}
                  onSelectAllBodyparts={filters.handleSelectAllBodyparts}
                />
                <CategoryAffinerSection
                  categoryParam={categoryParam}
                  filter={filter}
                  onFilterChange={setFilter}
                  equipmentsWithCounts={filters.equipmentsWithCounts}
                  selectedEquipments={filters.selectedEquipments}
                  setSelectedEquipments={filters.setSelectedEquipments}
                  isAllEquipmentsSelected={filters.isAllEquipmentsSelected}
                  onSelectAllEquipments={filters.handleSelectAllEquipments}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {showFilters && (
        <CategoryActiveFiltersBar
          categoryParam={categoryParam}
          filter={filter}
          selectedBodyparts={filters.selectedBodyparts}
          selectedEquipments={filters.selectedEquipments}
          onRemoveStatusFilter={onRemoveStatusFilter}
          onRemoveBodypart={onRemoveBodypart}
          onRemoveEquipment={onRemoveEquipment}
          onResetAll={onResetAll}
        />
      )}

      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-5 space-y-6">
        {loadingExercices ? (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filters.filteredExercices.length === 0 ? (
          <EmptyState
            icon={NAVIGATION_EMOJIS.FOLDER_OPEN}
            title={`Aucun exercice ${label.toLowerCase()}`}
            message={exercices.length === 0 ? 'Cette zone est vide pour le moment.' : 'Aucun exercice ne correspond à ces filtres.'}
            subMessage={exercices.length === 0 ? 'Ajoutez des exercices avec le bouton « Ajouter ».' : undefined}
          />
        ) : (
          <>
            {todoExercices.length > 0 && (
              <section aria-labelledby="todo-heading">
                <h2 id="todo-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  À faire · {todoExercices.length}
                </h2>
                {renderRows(todoExercices)}
              </section>
            )}
            {doneExercices.length > 0 && (
              <section aria-labelledby="done-heading">
                <h2 id="done-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {todoExercices.length === 0 ? '🎉 Tout est fait' : `Faits · ${doneExercices.length}`}
                </h2>
                {renderRows(doneExercices)}
              </section>
            )}
          </>
        )}

        {!loadingExercices && (
          <TouchLink
            href={preserveDate(`/exercice/add?category=${categoryParam.toLowerCase()}`)}
            className="flex items-center justify-center gap-2 min-h-[48px] rounded-xl border-2 border-dashed border-gray-200 text-base font-medium text-gray-500! active:bg-gray-50"
          >
            + Ajouter un exercice {label === 'Étirements' ? 'd’étirement' : `« ${label} »`}
          </TouchLink>
        )}

        {filters.relatedStretchingExercices.length > 0 && (
          <section aria-labelledby="stretching-heading">
            <h2 id="stretching-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Étirements conseillés · {label}
            </h2>
            {renderRows(filters.relatedStretchingExercices)}
          </section>
        )}
      </div>
    </section>
  );
}
