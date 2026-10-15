'use client';

import { memo } from 'react';
import { usePathname } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WelcomeHeader } from './WelcomeHeader';
import { useUser } from '@/app/contexts/UserContext';
import { useDayDetailModal } from '@/app/contexts/DayDetailModalContext';
import { usePeriodProgress } from '@/app/features/exercices';
import {
  getCurrentWeekData,
  getLast7DaysData,
  getHeatmapData,
  calculateCurrentStreak,
  type HeatmapDay,
} from '@/app/features/historique';
import { queryKeys, fetchHistory } from '@/app/lib/api-queries';
import type { HistoryEntry } from '@/app/types';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { isToday } from 'date-fns';
import clsx from 'clsx';
import { HOME_HISTORY_PRELOAD_DAYS } from '../constants/home.constants';
import { PERSISTED_QUERY_GC_TIME } from '@/app/providers/queryPersister';

type Props = {
  // Server-prefetched history, hydrated as initialData to avoid a client fetch at
  // mount. Currently unused (the entry route `/` is static — no SSR data); kept as
  // a brick for a future PPR/streaming-SSR home. See memory: cold-start-static-entry.
  initialHistory?: HistoryEntry[];
};

export const WelcomeHeaderWrapper = memo(function WelcomeHeaderWrapper({ initialHistory }: Props = {}) {
  const pathname = usePathname();
  const { effectiveUser, loading } = useUser();
  const { openDayDetail } = useDayDetailModal();
  const periodProgress = usePeriodProgress();
  const { selectedDate, isTimeMachineMode, referenceDateKey, referenceDate } = useTimeContext();
  const displayName = effectiveUser?.name || "";
  const resetFrequency = effectiveUser?.resetFrequency || null;

  const referenceDateForQuery = isTimeMachineMode && referenceDateKey ? referenceDateKey : undefined;

  // In normal mode, hydrate with server-provided history when available. In time
  // machine mode we ignore initialHistory (server data is for today, not the
  // selected date). initialHistory is currently never passed (static entry route).
  const shouldUseInitialHistory = !isTimeMachineMode && !!initialHistory;
  const { data: history = [] } = useQuery({
    queryKey: queryKeys.history.list({
      days: HOME_HISTORY_PRELOAD_DAYS,
      referenceDate: referenceDateForQuery,
    }),
    queryFn: () =>
      fetchHistory({
        days: HOME_HISTORY_PRELOAD_DAYS,
        referenceDate: referenceDateForQuery,
      }),
    enabled: !!effectiveUser,
    initialData: shouldUseInitialHistory ? initialHistory : undefined,
    initialDataUpdatedAt: shouldUseInitialHistory ? Date.now() : undefined,
    placeholderData: isTimeMachineMode ? undefined : (previousData) => previousData,
    staleTime: 30 * 1000, // 30 secondes
    // Persisted root: keep gcTime >= persist maxAge so the snapshot survives.
    gcTime: PERSISTED_QUERY_GC_TIME,
  });

  const frequency = resetFrequency || 'DAILY';
  const weekData = useMemo(
    () =>
      frequency === 'WEEKLY'
        ? getCurrentWeekData(history, referenceDate)
        : getLast7DaysData(history, referenceDate),
    [history, frequency, referenceDate]
  );

  const heatmapData = useMemo(
    () => getHeatmapData(history, HOME_HISTORY_PRELOAD_DAYS, referenceDate),
    [history, referenceDate]
  );

  // ⚠️ Streak plafonné à HOME_HISTORY_PRELOAD_DAYS jours : on ne précharge que
  // cette fenêtre côté SSR pour la perf. Augmenter la constante si on veut
  // afficher des streaks plus longs.
  const currentStreak = useMemo(
    () => calculateCurrentStreak(heatmapData, referenceDate),
    [heatmapData, referenceDate]
  );


  const handleDayClick = useCallback((day: HeatmapDay) => {
    openDayDetail(day);
  }, [openDayDetail]);

  const isHomePage = pathname === '/';

  if (!isHomePage || !effectiveUser || loading) {
    return null;
  }

  // Réduire le padding-top en mode sablier pour éviter les marges excessives
  const isBannerVisible = isTimeMachineMode && selectedDate && !isToday(selectedDate);

  return (
    <div className={clsx(
      'max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-3 md:px-6 lg:px-8',
      isBannerVisible ? 'pt-0' : 'pt-2 md:pt-4'
    )}>
      <WelcomeHeader
        userName={displayName}
        periodProgress={periodProgress}
        resetFrequency={resetFrequency}
        weekData={weekData}
        onDayClick={handleDayClick}
        currentStreak={currentStreak}
      />
    </div>
  );
});
