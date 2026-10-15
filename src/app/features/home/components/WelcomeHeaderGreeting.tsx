'use client';

import { useHandPreference } from '@/app/hooks/useHandPreference';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { formatShortDate } from '@/app/utils/date.utils';
import clsx from 'clsx';

type Props = {
  userName: string;
  currentStreak?: number;
};

function getTimeGreeting(referenceDate: Date) {
  const hour = referenceDate.getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

// The rhythm (daily / weekly) is a setting, not today's information: it lives
// in the profile, and the progress label already says "Aujourd'hui" or "Cette semaine".
export function WelcomeHeaderGreeting({ userName, currentStreak = 0 }: Props) {
  const { isLeftHanded } = useHandPreference();
  const { referenceDate, isTimeMachineMode, selectedDate } = useTimeContext();

  const greeting = getTimeGreeting(referenceDate);
  const greetingText = isTimeMachineMode && selectedDate
    ? `${greeting}, ${userName} (${formatShortDate(selectedDate)})`
    : `${greeting}, ${userName}`;

  return (
    <div className={clsx('relative z-10 flex items-center gap-2 justify-between', isLeftHanded && 'flex-row-reverse')}>
      <h1 className="text-xl md:text-2xl font-semibold text-gray-800">{greetingText}</h1>
      {currentStreak >= 2 && (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-semibold text-amber-700 bg-amber-50 shrink-0"
          aria-label={`${currentStreak} jours d'activité en série`}
        >
          <span aria-hidden>🔥</span>
          <span>{currentStreak}j</span>
        </span>
      )}
    </div>
  );
}
