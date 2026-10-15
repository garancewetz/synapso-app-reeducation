'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { ExerciceRow, useExercices, useExerciceStatusFilter, useExerciceHandlers, CategoryActiveFiltersBar } from '@/app/features/exercices';
import { TouchLink } from '@/app/components/TouchLink';
import { estimateMinutes, filterByEquipment } from '@/app/features/seance/utils/seance.utils';
import { EmptyState } from '@/app/components/EmptyState';
import { StatusFilterSection, EquipmentFilterBadge, AddButton } from '@/app/components/ui';
import { useLayoutContext } from '@/app/contexts/LayoutContext';
import { useHandPreference } from '@/app/hooks/useHandPreference';
import { NAVIGATION_EMOJIS } from '@/app/constants/emoji.constants';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_ICONS,
  EXERCICE_STATUS_FILTER_OPTIONS
} from '@/app/constants/exercice.constants';
import { getEquipmentIcon } from '@/app/constants/equipment.constants';
import { useEquipmentMetadata } from '@/app/hooks/useEquipmentMetadata';
import { ChevronIcon } from '@/app/components/ui/icons';
import type { Exercice, ExerciceCategory, ExerciceStatusFilter } from '@/app/types/exercice';

const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.div })),
  { ssr: false, loading: () => null }
);

export function EquipmentsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { preserveDate } = useLayoutContext();
  const { isLeftHanded } = useHandPreference();
  
  // Récupérer les équipements depuis l'URL (query param)
  const equipmentsFromUrl = searchParams.get('equipments');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>(
    equipmentsFromUrl 
      ? equipmentsFromUrl.split(',').map(eq => decodeURIComponent(eq)).filter(Boolean)
      : []
  );
  const [filter, setFilter] = useState<ExerciceStatusFilter>('all');

  // Charger les métadonnées des équipements via hook personnalisé
  const { equipmentsWithCounts, equipmentIconsMap, loading: loadingMetadata } = useEquipmentMetadata();

  // Mémoriser les options pour éviter les re-renders inutiles du hook
  // Si aucun équipement n'est sélectionné, on charge tous les exercices (undefined = pas de filtre)
  // Sinon, on filtre par les équipements sélectionnés
  const exercicesOptions = useMemo(() => {
    if (selectedEquipments.length === 0) {
      return undefined; // Pas de filtre = tous les exercices
    }
    return {
      equipments: selectedEquipments,
    };
  }, [selectedEquipments]);

  // Charger les exercices via hook personnalisé avec filtrage par équipements côté serveur
  const { exercices, loading: loadingExercices, updateExercice } = useExercices(exercicesOptions);

  // Utiliser les hooks partagés
  const { filteredExercices } = useExerciceStatusFilter({
    exercices,
    filter,
  });

  const { handleEditClick, handleCompleted } = useExerciceHandlers({
    updateExercice,
    fromPath: '/exercices/all',
  });

  const handleArchive = (updatedExercice: Exercice) => {
    updateExercice(updatedExercice);
  };

  // Fonction pour toggle un équipement dans la sélection
  const toggleEquipment = useCallback((equipmentName: string) => {
    setSelectedEquipments(prev => {
      if (prev.includes(equipmentName)) {
        return prev.filter(eq => eq !== equipmentName);
      } else {
        return [...prev, equipmentName];
      }
    });
  }, []);

  // Mettre à jour l'URL quand les équipements changent
  useEffect(() => {
    const currentEquipments = searchParams.get('equipments');
    const expectedEquipments = selectedEquipments.length > 0 
      ? selectedEquipments.map(eq => encodeURIComponent(eq)).join(',')
      : null;
    
    // Ne mettre à jour l'URL que si elle est différente de l'état actuel
    if (currentEquipments !== expectedEquipments) {
      const params = new URLSearchParams();
      if (selectedEquipments.length > 0) {
        params.set('equipments', selectedEquipments.map(eq => encodeURIComponent(eq)).join(','));
      }
      const newUrl = params.toString() 
        ? `/exercices/all?${params.toString()}`
        : '/exercices/all';
      router.replace(newUrl, { scroll: false });
    }
  }, [selectedEquipments, router, searchParams]);

  // Grouper par catégorie
  const exercicesByCategory = useMemo(() => {
    const grouped: Record<ExerciceCategory, Exercice[]> = {
      UPPER_BODY: [],
      LOWER_BODY: [],
      CORE: [],
      STRETCHING: [],
      FACE: [],
    };
    
    filteredExercices.forEach(ex => {
      grouped[ex.category].push(ex);
    });
    
    return grouped;
  }, [filteredExercices]);

  // Vérifier si le badge "Tous" est actif (aucun équipement sélectionné)
  const isAllEquipmentsSelected = useMemo(() => {
    return selectedEquipments.length === 0;
  }, [selectedEquipments.length]);

  // Fonction pour réinitialiser les équipements (sélectionner "Tous")
  const handleSelectAllEquipments = useCallback(() => {
    setSelectedEquipments([]);
  }, []);

  const handleResetAllFilters = useCallback(() => {
    setFilter('all');
    setSelectedEquipments([]);
  }, []);

  const statusLabel =
    EXERCICE_STATUS_FILTER_OPTIONS.find((opt) => opt.value === filter)?.label ?? 'Tous les exercices';

  const hasStatusFilter = filter !== 'all';
  const [statusOpen, setStatusOpen] = useState(false);

  // Session for the chosen equipment — computed on the same list as the session
  // itself (includeArchived: true, persisted), independent of the status filter.
  const { exercices: allExercices } = useExercices({ includeArchived: true });
  const [includeNoEquipment, setIncludeNoEquipment] = useState(false);
  const pendingAll = useMemo(
    () => allExercices.filter((exercice) => !exercice.archived && !exercice.completed),
    [allExercices]
  );
  const pendingWithEquipment = useMemo(
    () => filterByEquipment(pendingAll, selectedEquipments, false),
    [pendingAll, selectedEquipments]
  );
  const pendingNoEquipment = useMemo(
    () => pendingAll.filter((exercice) => exercice.equipments.length === 0),
    [pendingAll]
  );
  const sessionPlan = includeNoEquipment
    ? [...pendingWithEquipment, ...pendingNoEquipment]
    : pendingWithEquipment;
  const sessionHref = preserveDate(
    `/seance?equipments=${encodeURIComponent(selectedEquipments.join(','))}${includeNoEquipment ? '&sansMateriel=1' : ''}`
  );


  return (
    <section className="pb-40 md:pb-8 min-h-screen">
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto pt-2 md:pt-4 px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className={clsx(
            'flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4',
            isLeftHanded && 'md:flex-row-reverse'
          )}>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Vue par équipement
              </h1>
              {loadingExercices ? (
                <p className="text-gray-500 mt-1">
                  <span className="inline-block h-5 w-48 bg-gray-200 rounded animate-pulse" />
                </p>
              ) : (
                <p className="text-gray-500 mt-1">
                  {selectedEquipments.length > 0 
                    ? `${filteredExercices.length} exercice${filteredExercices.length > 1 ? 's' : ''} avec ${selectedEquipments.length === 1 ? selectedEquipments[0] : `${selectedEquipments.length} équipements`}`
                    : `${filteredExercices.length} exercice${filteredExercices.length > 1 ? 's' : ''}`
                  }
                </p>
              )}
            </div>
                        <AddButton
                href={preserveDate('/exercice/add')}
                label="Ajouter un exercice"
                className="shrink-0 w-full h-10! px-3! text-sm! md:w-auto md:h-11! md:px-5! md:text-base!"
              />
          </div>
          
          {/* Filtres */}
          <div className="mt-4 space-y-4">
            {/* Filtre par équipement (mis en avant) */}
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-2">
                Équipement
              </label>
              {loadingMetadata ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={`equipment-skeleton-${i}`}
                      className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : equipmentsWithCounts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <EquipmentFilterBadge
                    label="Tous"
                    isActive={isAllEquipmentsSelected}
                    onClick={handleSelectAllEquipments}
                  />
                  {equipmentsWithCounts.map(({ name, count }) => {
                    const icon = equipmentIconsMap[name] || getEquipmentIcon(name);
                    const isSelected = selectedEquipments.includes(name);
                    return (
                      <EquipmentFilterBadge
                        key={name}
                        label={name}
                        icon={icon}
                        count={count}
                        isActive={isSelected}
                        onClick={() => toggleEquipment(name)}
                        ariaLabel={`${isSelected ? 'Désélectionner' : 'Sélectionner'} ${name} (${count} exercices)`}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucun équipement disponible pour le moment
                </p>
              )}
            </div>

            {/* Filtre d'état : Tous / Non faits / Faits (section repliable, comme sur la page catégorie) */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/80">
              <button
                type="button"
                onClick={() => setStatusOpen((prev) => !prev)}
                className={clsx(
                  'w-full flex items-center justify-between gap-3 min-h-[44px] py-3 px-4',
                  'text-sm font-medium text-gray-800',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 focus-visible:ring-inset rounded-lg',
                  'active:bg-gray-100/80 transition-colors duration-200'
                )}
                aria-expanded={statusOpen}
                aria-controls="equipments-status-filters"
                aria-label={
                  statusOpen
                    ? 'Masquer les filtres par état'
                    : 'Afficher les filtres par état'
                }
              >
                <span className="flex items-center gap-2">
                  Filtrer par état
                  {hasStatusFilter && (
                    <span
                      className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-400 text-gray-900 text-xs font-semibold"
                      aria-hidden
                    >
                      1
                    </span>
                  )}
                </span>
                <span className="text-xs font-normal text-gray-600">
                  {statusLabel}
                </span>
                <ChevronIcon
                  direction={statusOpen ? 'up' : 'down'}
                  className={clsx(
                    'w-5 h-5 text-gray-700 shrink-0 transition-transform duration-300 ease-out',
                    statusOpen && 'text-gray-900'
                  )}
                  aria-hidden
                />
              </button>
              <div
                id="equipments-status-filters"
                className={clsx(
                  'overflow-hidden transition-all duration-300 ease-out',
                  statusOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                )}
                aria-hidden={!statusOpen}
              >
                <div className="pt-1 pb-4 px-4">
                  <StatusFilterSection filter={filter} onFilterChange={setFilter} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <CategoryActiveFiltersBar
          categoryParam={CATEGORY_ORDER[0]}
          filter={filter}
          selectedBodyparts={[]}
          selectedEquipments={selectedEquipments}
          onRemoveStatusFilter={() => setFilter('all')}
          onRemoveBodypart={() => {}}
          onRemoveEquipment={toggleEquipment}
          onResetAll={handleResetAllFilters}
        />

        {/* "Je suis sur mon tapis" : faire tout ce qui se fait avec ce matériel. */}
        {selectedEquipments.length > 0 && pendingWithEquipment.length + (includeNoEquipment ? pendingNoEquipment.length : 0) > 0 && (
          <div className="mb-6 space-y-2">
            <TouchLink
              href={sessionHref}
              className="flex items-center gap-4 rounded-2xl bg-emerald-500 px-5 py-3.5 text-emerald-950! shadow-md active:scale-[0.98] transition-transform"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/30 text-xl" aria-hidden="true">▶</span>
              <span>
                <span className="block text-lg font-semibold">Lancer la séance</span>
                <span className="block text-sm text-emerald-900">
                  {selectedEquipments.join(', ')}{includeNoEquipment && ' + sans matériel'} · {sessionPlan.length} exercice{sessionPlan.length > 1 ? 's' : ''} · environ {estimateMinutes(sessionPlan)} min
                </span>
              </span>
            </TouchLink>
            {pendingNoEquipment.length > 0 && (
              <label className="flex items-center gap-3 min-h-[44px] px-1 text-base text-gray-700">
                <input
                  type="checkbox"
                  checked={includeNoEquipment}
                  onChange={(e) => setIncludeNoEquipment(e.target.checked)}
                  className="h-5 w-5 rounded accent-emerald-600"
                />
                Ajouter les {pendingNoEquipment.length} exercice{pendingNoEquipment.length > 1 ? 's' : ''} sans matériel
              </label>
            )}
          </div>
        )}

        {/* Exercices - toujours affichés, filtrés par équipements si sélectionnés */}
        <div className="">
          {loadingExercices ? (
            <div className="flex items-center justify-center min-h-screen py-12">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : filteredExercices.length === 0 ? (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <EmptyState
                icon={NAVIGATION_EMOJIS.FOLDER_OPEN}
                title={
                  filter === 'notCompleted'
                    ? "Tous les exercices sont faits !"
                    : filter === 'completed'
                    ? "Aucun exercice fait"
                    : "Aucun exercice"
                }
                message={
                  filter === 'notCompleted'
                    ? "Félicitations, vous avez complété tous les exercices correspondant aux filtres sélectionnés."
                    : filter === 'completed'
                    ? "Vous n'avez pas encore complété d'exercices correspondant aux filtres sélectionnés."
                    : "Aucun exercice ne correspond aux filtres sélectionnés."
                }
              />
            </MotionDiv>
          ) : (
            <div className="space-y-6">
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
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
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
