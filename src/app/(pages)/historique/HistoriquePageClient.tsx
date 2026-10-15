'use client';

import { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/app/contexts/UserContext';
import { useDayDetailModal } from '@/app/contexts/DayDetailModalContext';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { useHistory, useHeatmapNavigation, calculateCurrentStreak } from '@/app/features/historique';
import type { HeatmapDay } from '@/app/features/historique';
import { ActivityRounds } from '@/app/features/historique/components/ActivityRounds';
import { countByZone, summarizeAllTime, summarizePeriod } from '@/app/features/historique/utils/progression.utils';
import { useProgressInfinite, useProgressModal } from '@/app/features/progress';
import { PinnedProgressRow } from '@/app/features/home/components/HomePinnedRows';
import { ChevronIcon } from '@/app/components/ui/icons';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '@/app/constants/exercice.constants';
import { PROGRESS_ADD_ACTION } from '@/app/constants/progress.constants';
import { queryKeys } from '@/app/lib/api-queries';
import { getDateKeyUTC } from '@/app/utils/date.utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ProgressSlideshow = dynamic(
  () => import('@/app/features/historique').then((mod) => ({ default: mod.ProgressSlideshow })),
  { ssr: false, loading: () => null }
);
const ProgressBottomSheet = dynamic(
  () => import('@/app/features/progress').then((mod) => ({ default: mod.ProgressBottomSheet })),
  { ssr: false, loading: () => null }
);
const ConfettiRain = dynamic(
  () => import('@/app/features/exercices').then((mod) => ({ default: mod.ConfettiRain })),
  { ssr: false, loading: () => null }
);

const PERIOD_DAYS = 28;
// The latest wins at a glance; the rest one tap away.
const PROGRESS_PREVIEW = 5;

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;
const activeDays = (n: number) => (n > 1 ? `${n} jours actifs` : `${n} jour actif`);

/**
 * "Ma progression" — one scrolling page, no tabs: what was done (never a
 * failure rate), the same rounds as the home, the same 5 body zones as
 * everywhere, then the user's wins ("progrès") as compact rows.
 */
export function HistoriquePageClient() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [periodOffset, setPeriodOffset] = useState(0);
  const [showAllProgress, setShowAllProgress] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { effectiveUser } = useUser();
  const { openDayDetail } = useDayDetailModal();
  const progressModal = useProgressModal();
  const { openForCreate } = progressModal;
  const { selectedDateKey, isTimeMachineMode, referenceDate } = useTimeContext();

  // The whole history: the period, the all-time totals and the zones derive from it.
  const { history, loading: loadingHistory } = useHistory({ days: null });
  const deferredHistory = useDeferredValue(history);
  const {
    progressList,
    loading: loadingProgress,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProgressInfinite();

  const {
    heatmapData,
    periodLabel,
    canGoBack,
    canGoForward,
    goToPreviousPeriod,
    goToNextPeriod,
  } = useHeatmapNavigation(deferredHistory, PERIOD_DAYS, { value: periodOffset, set: setPeriodOffset });

  // heatmapData starts with alignment padding (isEmpty, dateKey "empty-n"): keep real days.
  const periodDays = useMemo(() => heatmapData.filter((day) => !day.isEmpty), [heatmapData]);
  const period = useMemo(() => summarizePeriod(periodDays), [periodDays]);
  const allTime = useMemo(
    () => summarizeAllTime(deferredHistory, isTimeMachineMode ? selectedDateKey ?? undefined : undefined),
    [deferredHistory, isTimeMachineMode, selectedDateKey]
  );
  const zones = useMemo(() => {
    if (periodDays.length === 0) return [];
    return countByZone(deferredHistory, periodDays[0].dateKey, periodDays[periodDays.length - 1].dateKey);
  }, [deferredHistory, periodDays]);
  const maxZoneCount = Math.max(1, ...zones.map((zone) => zone.count));
  const currentStreak = useMemo(() => calculateCurrentStreak(heatmapData, referenceDate), [heatmapData, referenceDate]);

  // Time machine: only what existed at the selected date.
  const filteredProgress = useMemo(() => {
    if (!isTimeMachineMode || !selectedDateKey) return progressList;
    return progressList.filter((progress) => {
      const key = getDateKeyUTC(progress.createdAt);
      return key !== null && key <= selectedDateKey;
    });
  }, [progressList, isTimeMachineMode, selectedDateKey]);

  // Coming back after a break: welcome, and show what was already achieved.
  const isReturning = periodOffset === 0 && period.activeDays === 0 && allTime.exercises > 0;

  // ?action=add (menu "Noter un progrès"): open the creation sheet, then clean the URL.
  useEffect(() => {
    if (searchParams.get('action') !== PROGRESS_ADD_ACTION) return;
    openForCreate();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('action');
    params.delete('tab');
    const query = params.toString();
    router.replace(`${window.location.pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }, [searchParams, openForCreate, router]);

  useEffect(() => {
    if (!showConfetti) return;
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, [showConfetti]);

  const invalidateProgress = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.all, refetchType: 'active' });
  }, [queryClient]);

  const handleProgressSuccess = useCallback(() => {
    setShowConfetti(true);
    invalidateProgress();
  }, [invalidateProgress]);

  const handleDayClick = useCallback((day: HeatmapDay) => openDayDetail(day), [openDayDetail]);

  const loading = loadingHistory || loadingProgress;

  return (
    <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto pt-2 md:pt-4 pb-6 md:pb-8 px-4 md:px-6 lg:px-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Ma progression</h1>

      {loading ? (
        <div className="mt-5 space-y-4" aria-hidden="true">
          <div className="h-80 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      ) : (
        <div className="mt-5 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start space-y-6 lg:space-y-0">
          <div className="space-y-6">
            {isReturning && (
              <p className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-base text-amber-900">
                👋 Bon retour ! Chaque séance compte, même courte.
              </p>
            )}

            {/* Activity over a 28-day period */}
            <section aria-labelledby="activity-heading" className="rounded-2xl bg-white border border-gray-200 p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPeriod}
                  disabled={!canGoBack}
                  aria-label="Période précédente"
                  className="flex items-center justify-center w-11 h-11 rounded-full text-gray-500 disabled:opacity-30 active:bg-gray-100"
                >
                  <ChevronIcon direction="left" className="w-5 h-5" />
                </button>
                <h2 id="activity-heading" className="text-base font-semibold text-gray-700 text-center">
                  {periodOffset === 0 ? '28 derniers jours' : periodLabel}
                </h2>
                <button
                  type="button"
                  onClick={goToNextPeriod}
                  disabled={!canGoForward}
                  aria-label="Période suivante"
                  className="flex items-center justify-center w-11 h-11 rounded-full text-gray-500 disabled:opacity-30 active:bg-gray-100"
                >
                  <ChevronIcon direction="right" className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xl font-semibold text-gray-900">
                {period.activeDays > 0
                  ? `${activeDays(period.activeDays)} · ${plural(period.exercises, 'exercice')}`
                  : 'Pas d’exercice sur cette période'}
              </p>

              <ActivityRounds days={heatmapData} onDayClick={handleDayClick} />

              {(period.bestStreak >= 2 || currentStreak >= 2) && (
                <p className="text-base text-gray-600">
                  🔥 {currentStreak >= 2 && periodOffset === 0
                    ? `Série en cours : ${currentStreak} jours`
                    : `Meilleure série : ${period.bestStreak} jours`}
                </p>
              )}
            </section>

            {allTime.exercises > 0 && (
              <p className="px-1 text-base text-gray-600">
                <span className="font-semibold text-gray-800">Depuis le début :</span>{' '}
                {plural(allTime.exercises, 'exercice')} · {activeDays(allTime.activeDays)}
                {allTime.sinceKey && ` (depuis le ${format(new Date(allTime.sinceKey + 'T12:00:00'), 'd MMMM yyyy', { locale: fr })})`}
              </p>
            )}

            {/* The same 5 body zones as the home, over the same period */}
            <section aria-labelledby="zones-heading">
              <h2 id="zones-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Mes zones sur cette période
              </h2>
              <ul className="rounded-2xl bg-white border border-gray-200 divide-y divide-gray-100">
                {zones.map(({ category, count }) => (
                  <li key={category} className="flex items-center gap-3 px-4 min-h-[52px]">
                    <span className="text-xl w-7 text-center" aria-hidden="true">{CATEGORY_ICONS[category]}</span>
                    <span className="w-28 shrink-0 text-base font-medium text-gray-800">{CATEGORY_LABELS[category]}</span>
                    <span className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
                      <span
                        className={clsx('block h-full rounded-full', CATEGORY_COLORS[category].accent)}
                        style={{ width: `${(count / maxZoneCount) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 text-right text-base font-semibold tabular-nums text-gray-700">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* The user's wins */}
          <section aria-labelledby="progress-heading">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 id="progress-heading" className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Mes progrès{filteredProgress.length > 0 && ` · ${filteredProgress.length}${hasNextPage ? '+' : ''}`}
              </h2>
              <button
                type="button"
                onClick={() => openForCreate()}
                className="min-h-[44px] px-4 rounded-xl bg-amber-100 text-amber-900 text-base font-semibold active:scale-[0.97]"
              >
                + Noter un progrès
              </button>
            </div>

            {filteredProgress.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-gray-200 px-4 py-6 text-center text-base text-gray-500">
                Note ici tes victoires, même petites :<br />« J’ai tenu 1 minute en gainage » ⭐
              </p>
            ) : (
              <>
                <ul className="grid gap-2">
                  {(showAllProgress ? filteredProgress : filteredProgress.slice(0, PROGRESS_PREVIEW)).map((progress) => (
                    <li key={progress.id}>
                      <PinnedProgressRow progress={progress} onOpen={progressModal.openForEdit} />
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2">
                  {!showAllProgress && (filteredProgress.length > PROGRESS_PREVIEW || hasNextPage) && (
                    <button
                      type="button"
                      onClick={() => setShowAllProgress(true)}
                      className="min-h-[44px] text-base font-medium text-gray-600 underline underline-offset-4"
                    >
                      Voir tous mes progrès
                    </button>
                  )}
                  {showAllProgress && hasNextPage && (
                    <button
                      type="button"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="min-h-[44px] text-base font-medium text-gray-600 underline underline-offset-4"
                    >
                      {isFetchingNextPage ? 'Chargement…' : 'Voir plus'}
                    </button>
                  )}
                  {filteredProgress.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => setIsSlideshowOpen(true)}
                      className="min-h-[44px] text-base font-medium text-gray-600 underline underline-offset-4"
                    >
                      Revoir en diaporama
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      <ConfettiRain show={showConfetti} fromWindow variant="golden" emojiCount={8} confettiCount={35} />

      {effectiveUser && (
        <ProgressBottomSheet
          isOpen={progressModal.isOpen}
          onClose={progressModal.close}
          onSuccess={handleProgressSuccess}
          onDeleteSuccess={invalidateProgress}
          userId={effectiveUser.id}
          progressToEdit={progressModal.progressToEdit}
        />
      )}

      <ProgressSlideshow isOpen={isSlideshowOpen} onClose={() => setIsSlideshowOpen(false)} progressList={filteredProgress} />
    </div>
  );
}
