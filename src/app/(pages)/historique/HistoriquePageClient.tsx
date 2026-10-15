'use client';

import { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/app/contexts/UserContext';
import { useDayDetailModal } from '@/app/contexts/DayDetailModalContext';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { useHistory } from '@/app/features/historique';
import { useProgress, useProgressInfinite, useProgressStats, useProgressModal } from '@/app/features/progress';
import { useHeatmapNavigation, getRequiredDaysForOffset } from '@/app/features/historique';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/lib/api-queries';

// ⚡ PERFORMANCE: Charger dynamiquement les composants lourds avec loading
const ProgressSlideshow = dynamic(
  () => import('@/app/features/historique').then(mod => ({ default: mod.ProgressSlideshow })),
  { ssr: false, loading: () => null }
);

const ProgressBottomSheet = dynamic(
  () => import('@/app/features/progress').then(mod => ({ default: mod.ProgressBottomSheet })),
  { ssr: false, loading: () => null }
);

const ConfettiRain = dynamic(
  () => import('@/app/features/exercices').then(mod => ({ default: mod.ConfettiRain })),
  { ssr: false, loading: () => null }
);

import { BackButton } from '@/app/components/ui/BackButton';
import { SegmentedControl, Loader, ProgressButton } from '@/app/components/ui';
import type { HeatmapDay } from '@/app/features/historique';
import { NAVIGATION_EMOJIS, PROGRESS_EMOJIS } from '@/app/constants/emoji.constants';
import { PROGRESS_ADD_ACTION } from '@/app/constants/progress.constants';
import { formatProgressForShare } from '@/app/utils/share';
import { getDateKeyUTC } from '@/app/utils/date.utils';
import {
  calculateBodypartStatsByPeriod,
  getDonutDataBodyparts,
  calculateCurrentStreak,
  HistoriqueStatistiquesSection,
  HistoriqueProgresSection,
} from '@/app/features/historique';

type BodypartPeriodFilter = 'week' | 'month' | 'all';
type ActiveTab = 'statistiques' | 'progres';

// 28 jours pour le heatmap du mois
const MONTH_HEATMAP_DAYS = 28;

type Props = {
  /** Quand true, la page est affichée dans l’onglet Suivi de l’accueil (pas de bouton retour). */
  embeddedInHome?: boolean;
};

export function HistoriquePageClient({ embeddedInHome = false }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [bodypartPeriod, setBodypartPeriod] = useState<BodypartPeriodFilter>('week');
  const [activeTab, setActiveTab] = useState<ActiveTab>('progres');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { effectiveUser } = useUser();
  const { openDayDetail } = useDayDetailModal();
  const progressModal = useProgressModal();
  const { openForCreate } = progressModal;
  const displayName = effectiveUser?.name || "";

  const [heatmapOffset, setHeatmapOffset] = useState(0);

  const historyDays = bodypartPeriod === 'all' ? null : getRequiredDaysForOffset(heatmapOffset, MONTH_HEATMAP_DAYS);

  // Charger l'historique (jours adaptés à la navigation des deux composants)
  const { history, loading: loadingHistory } = useHistory({ days: historyDays });

  // Récupérer tous les progrès pour calculer le nombre total de victoires (compteur global)
  const { progressList: allProgressList } = useProgress();

  const {
    progressList,
    loading: loadingProgress,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProgressInfinite();
  const queryClient = useQueryClient();

  const { selectedDateKey, isTimeMachineMode, referenceDate } = useTimeContext();

  // ⚡ PERFORMANCE: Utiliser useDeferredValue pour les calculs non critiques
  // Cela permet de rendre l'UI immédiatement et de différer les calculs lourds
  const deferredHistory = useDeferredValue(history);
  const deferredProgressList = useDeferredValue(progressList);

  // Calculer les numéros de victoire globaux à partir de la liste complète des progrès
  const victoryNumbersById = useMemo(() => {
    if (!allProgressList || allProgressList.length === 0) {
      return {} as Record<number, number>;
    }

    const total = allProgressList.length;
    const map: Record<number, number> = {};

    allProgressList.forEach((progressItem, index) => {
      map[progressItem.id] = total - index;
    });

    return map;
  }, [allProgressList]);

  // ⚡ PERFORMANCE: Pré-calculer les dateKeys UNE SEULE FOIS (indexation)
  // Utiliser deferredHistory pour différer les calculs lourds
  const historyDateKeys = useMemo(() => {
    const map = new Map<number, string>(); // Cache des dateKeys par ID (UTC, aligné serveur)
    deferredHistory.forEach(entry => {
      if (!map.has(entry.id)) {
        const key = getDateKeyUTC(entry.completedAt);
        if (key) map.set(entry.id, key);
      }
    });
    return map;
  }, [deferredHistory]);

  // ⚡ PERFORMANCE: Filtrer avec comparaison de strings (ultra-rapide, pas de format() dans le filtre)
  const filteredHistory = useMemo(() => {
    if (!isTimeMachineMode || !selectedDateKey) {
      return deferredHistory;
    }
    return deferredHistory.filter(entry => {
      const entryDateKey = historyDateKeys.get(entry.id);
      return entryDateKey && entryDateKey <= selectedDateKey;
    });
  }, [deferredHistory, isTimeMachineMode, selectedDateKey, historyDateKeys]);

  // ⚡ PERFORMANCE: Pré-calculer les dateKeys pour les progrès
  const progressDateKeys = useMemo(() => {
    const map = new Map<number, string>();
    deferredProgressList.forEach(progress => {
      if (!map.has(progress.id)) {
        const key = getDateKeyUTC(progress.createdAt);
        if (key) map.set(progress.id, key);
      }
    });
    return map;
  }, [deferredProgressList]);

  // Filtrer les progrès par date sélectionnée (optimisé)
  const filteredProgress = useMemo(() => {
    if (!isTimeMachineMode || !selectedDateKey) {
      return deferredProgressList;
    }
    return deferredProgressList.filter(progress => {
      const progressDateKey = progressDateKeys.get(progress.id);
      return progressDateKey && progressDateKey <= selectedDateKey;
    });
  }, [deferredProgressList, isTimeMachineMode, selectedDateKey, progressDateKeys]);


  // Déterminer l'onglet actif depuis l'URL (query param prioritaire, puis hash pour rétrocompat)
  // Dépend de searchParams pour réagir aux changements d'URL sans remount
  // (ex : raccourci "Progrès" cliqué alors qu'on est déjà sur /historique)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const replaceParams = (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    };

    const action = searchParams.get('action');
    const tabParam = searchParams.get('tab');
    // Rétrocompat anciens liens : le hash n'évolue qu'au mount, pas besoin de l'observer
    const hash = window.location.hash;

    if (action === PROGRESS_ADD_ACTION) {
      openForCreate();
      replaceParams((params) => {
        params.delete('action');
        if (!params.has('tab')) params.set('tab', 'progres');
      });
      return;
    }

    if (tabParam === 'statistiques' || tabParam === 'progres') {
      setActiveTab(tabParam);
    } else if (hash === '#statistiques') {
      setActiveTab('statistiques');
      replaceParams((params) => params.set('tab', 'statistiques'));
    } else {
      setActiveTab('progres');
      if (!tabParam) {
        replaceParams((params) => params.set('tab', 'progres'));
      }
    }
  }, [searchParams, openForCreate, router]);

  // Réinitialiser les confettis après l'animation
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleProgressSuccess = useCallback(() => {
    setShowConfetti(true);
    // ⚡ TANSTACK QUERY: Invalider les queries concernées
    // TanStack Query gère automatiquement la réactivité - les queries actives sont refetchées automatiquement
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.progress.all,
      refetchType: 'active',
    });
  }, [queryClient]);

  const handleProgressDeleteSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.progress.all,
      refetchType: 'active',
    });
  }, [queryClient]);

  // Handler pour le pin (invalider le cache TanStack Query)
  const handlePin = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.progress.all,
      refetchType: 'active',
    });
  }, [queryClient]);

  // Handler pour le partage (optionnel, le partage est déjà géré par useShareProgress dans ProgressCard)
  const handleShare = useCallback(async (progress: typeof progressList[0]) => {
    // L'API Web Share permet de choisir entre Mail, Messages, WhatsApp, etc.
    if (navigator.share) {
      try {
        const message = formatProgressForShare(progress);
        await navigator.share({
          text: message,
          title: 'Mon progrès sur Synapso',
        });
      } catch {
        // Si l'utilisateur annule ou si le partage échoue, ne rien faire
      }
    }
    // Sinon, le partage est déjà géré par useShareProgress dans ProgressCard
  }, []);

  const {
    progressDates,
  } = useProgressStats(deferredProgressList);

  const donutDataBodyparts = useMemo(() => {
    const bodypartStats = calculateBodypartStatsByPeriod(filteredHistory, bodypartPeriod);
    return getDonutDataBodyparts(bodypartStats);
  }, [filteredHistory, bodypartPeriod]);
  
  // ⚡ PERFORMANCE: Utiliser TimeContext pour la date de référence (déjà calculée et mémorisée)
  
  // ⚡ FIX: Le heatmap affiche toujours les 28 derniers jours depuis aujourd'hui
  // même en mode sablier, pour permettre de se situer dans le temps
  // Le jour sélectionné sera mis en évidence visuellement dans ActivityHeatmapCell
  // ⚡ PERFORMANCE: Utiliser deferredHistory pour différer les calculs lourds du heatmap
  const {
    heatmapData,
    periodLabel: heatmapPeriodLabel,
    canGoBack: canGoBackHeatmap,
    canGoForward: canGoForwardHeatmap,
    goToPreviousPeriod: goToPreviousHeatmapPeriod,
    goToNextPeriod: goToNextHeatmapPeriod,
  } = useHeatmapNavigation(deferredHistory, MONTH_HEATMAP_DAYS, { value: heatmapOffset, set: setHeatmapOffset });
  
  const currentStreak = useMemo(() => calculateCurrentStreak(heatmapData, referenceDate), [heatmapData, referenceDate]);

  const handleDayClick = useCallback((day: HeatmapDay) => openDayDetail(day), [openDayDetail]);

  const loading = loadingHistory || loadingProgress;
  const STAR_BRIGHT_EMOJI = PROGRESS_EMOJIS?.STAR_BRIGHT || '🌟';

  return (
    <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto pt-2 md:pt-4 pb-40 md:pb-8 px-3 md:px-6 lg:px-8">
      {!embeddedInHome && (
        <BackButton
          className="mb-4"
          buttonClassName="py-3"
        />
      )}

      <div className="sm:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className={clsx(
            'flex flex-col gap-2 mb-2 md:flex-row md:items-center md:justify-between md:gap-4',
            effectiveUser?.dominantHand === 'LEFT' && 'md:flex-row-reverse'
          )}>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                {NAVIGATION_EMOJIS.ROCKET} Ma progression
              </h1>
              <p className="text-gray-500 mt-2">
                Statistiques et progrès de ta progression de rééducation
              </p>
            </div>
                        <ProgressButton
                variant="inline"
                onClick={() => progressModal.openForCreate()}
                label="Ajouter un progrès"
                className="shrink-0 w-full h-10! px-3! text-sm! md:w-auto md:h-11! md:px-5! md:text-base!"
              />
          </div>
        </div>

        {/* Navigation par onglets (masquée sur xl : les deux colonnes sont visibles) */}
        {!loading && (
          <div className="mb-6 xl:hidden">
            <SegmentedControl
              options={[
                { value: 'progres', label: `${STAR_BRIGHT_EMOJI} Progrès` },
                { value: 'statistiques', label: '📊 Statistiques' },
              ]}
              value={activeTab}
              onChange={(value) => {
                setActiveTab(value as ActiveTab);
                const params = new URLSearchParams(searchParams.toString());
                params.set('tab', value);
                const newUrl = params.toString()
                  ? `${window.location.pathname}?${params.toString()}`
                  : window.location.pathname;
                router.replace(newUrl, { scroll: false });
              }}
              fullWidth
              size="md"
              variant="navigation"
            />
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader size="xl" />
            <p className="text-gray-600 font-medium">
              Chargement de ta progression... 📊
            </p>
          </div>
        ) : (
          <div className="xl:grid xl:grid-cols-2 xl:gap-8 xl:items-start">
            <div className={clsx(activeTab !== 'statistiques' && 'hidden', 'xl:block')}>
              <HistoriqueStatistiquesSection
                heatmapData={heatmapData}
                heatmapPeriodLabel={heatmapPeriodLabel}
                goToPreviousHeatmapPeriod={goToPreviousHeatmapPeriod}
                goToNextHeatmapPeriod={goToNextHeatmapPeriod}
                canGoBackHeatmap={canGoBackHeatmap}
                canGoForwardHeatmap={canGoForwardHeatmap}
                donutDataBodyparts={donutDataBodyparts}
                bodypartPeriod={bodypartPeriod}
                onBodypartPeriodChange={setBodypartPeriod}
                onDayClick={handleDayClick}
                currentStreak={currentStreak}
                progressDates={progressDates}
                loadingHistory={loadingHistory}
                displayName={displayName}
              />
            </div>
            <div className={clsx(activeTab !== 'progres' && 'hidden', 'xl:block')}>
              <HistoriqueProgresSection
                filteredProgress={filteredProgress}
                filteredHistory={filteredHistory}
                deferredProgressList={deferredProgressList}
                fullProgressList={allProgressList}
                loadingProgress={loadingProgress}
                victoryNumbersById={victoryNumbersById}
                onEdit={progressModal.openForEdit}
                onShare={handleShare}
                onPin={handlePin}
                onOpenSlideshow={() => setIsSlideshowOpen(true)}
                hasUser={!!effectiveUser}
                starEmoji={STAR_BRIGHT_EMOJI}
                onLoadMore={fetchNextPage}
                hasMore={hasNextPage}
                loadingMore={isFetchingNextPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pluie de confettis dorés */}
      <ConfettiRain 
        show={showConfetti} 
        fromWindow 
        variant="golden"
        emojiCount={8}
        confettiCount={35}
      />

      {/* Modal de progrès */}
      {effectiveUser && (
        <ProgressBottomSheet
          isOpen={progressModal.isOpen}
          onClose={progressModal.close}
          onSuccess={handleProgressSuccess}
          onDeleteSuccess={handleProgressDeleteSuccess}
          userId={effectiveUser.id}
          progressToEdit={progressModal.progressToEdit}
        />
      )}

      <ProgressSlideshow
        isOpen={isSlideshowOpen}
        onClose={() => setIsSlideshowOpen(false)}
        progressList={filteredProgress}
      />
    </div>
  );
}
