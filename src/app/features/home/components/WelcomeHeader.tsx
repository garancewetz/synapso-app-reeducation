'use client';

import clsx from 'clsx';
import type { HeatmapDay } from '@/app/features/historique';
import { useCelebration } from '@/app/hooks/useCelebration';
import { WelcomeHeaderGreeting } from './WelcomeHeaderGreeting';
import { PeriodProgressBar } from '@/app/features/exercices';
import type { PeriodProgress } from '@/app/features/exercices/hooks/usePeriodProgress';
import { WelcomeHeaderCelebration } from './WelcomeHeaderCelebration';
import { WeekCalendar } from '@/app/features/historique';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { formatShortDate } from '@/app/utils/date.utils';
import { NAVIGATION_EMOJIS } from '@/app/constants/emoji.constants';

type Props = {
  userName: string;
  periodProgress: PeriodProgress | null;
  resetFrequency?: 'DAILY' | 'WEEKLY' | null;
  weekData?: HeatmapDay[];
  progressDates?: Set<string>;
  onDayClick?: (day: HeatmapDay) => void;
  currentStreak?: number;
};

export function WelcomeHeader({ userName, periodProgress, resetFrequency = null, weekData, progressDates, onDayClick, currentStreak = 0 }: Props) {
  const { showCelebration, animationKey } = useCelebration(periodProgress);
  const { isTimeMachineMode, selectedDate } = useTimeContext();
  
  const isGoalReached =
    periodProgress !== null && periodProgress.total > 0 && periodProgress.done >= periodProgress.total;

  return (
    <div 
      className={clsx(
        'relative bg-white rounded-2xl shadow-sm border py-5 md:p-6 mb-6 overflow-hidden transition-all duration-500',
        isGoalReached ? 'border-emerald-300 shadow-emerald-100' : 'border-gray-200'
      )}
    >
      <WelcomeHeaderCelebration 
        isGoalReached={isGoalReached}
        showCelebration={showCelebration}
        animationKey={animationKey}
      />

      {isTimeMachineMode && selectedDate && (
        <div className="mx-2 mb-3 px-3 py-2 bg-indigo-900 border-2 border-indigo-600 rounded-lg flex items-center gap-2">
          <span className="text-xl text-amber-400">{NAVIGATION_EMOJIS.HOURGLASS}</span>
          <span className="text-sm font-bold text-white">
            Mode sablier - {formatShortDate(selectedDate)}
          </span>
        </div>
      )}

      <WelcomeHeaderGreeting userName={userName} resetFrequency={resetFrequency} currentStreak={currentStreak} />
      <PeriodProgressBar progress={periodProgress} resetFrequency={resetFrequency} />
      
      {weekData && weekData.length === 7 && (
        <WeekCalendar 
          weekData={weekData}
          progressDates={progressDates}
          onDayClick={onDayClick}
          resetFrequency={resetFrequency}
        />
      )}
    </div>
  );
}
