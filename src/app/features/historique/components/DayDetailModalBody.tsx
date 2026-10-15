import { useMemo } from 'react';
import type { Progress } from '@/app/types';
import type { ExerciceCategory } from '@/app/types/exercice';
import { CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_ORDER, CATEGORY_LABELS_SHORT } from '@/app/constants/exercice.constants';
import { PROGRESS_EMOJIS, NAVIGATION_EMOJIS } from '@/app/constants/emoji.constants';
import { formatTime, formatShortDate } from '@/app/utils/date.utils';
import { Button, BorderedIconList } from '@/app/components/ui';
import { MAX_TIME_MACHINE_DAYS } from '@/app/constants/historique.constants';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { isToday, subDays, isBefore, isAfter, startOfDay } from 'date-fns';
import clsx from 'clsx';

type DayExercise = {
  id: number;
  name: string;
  category: ExerciceCategory;
  completedAt: string;
};

type Props = {
  date: Date | null;
  exercises: DayExercise[];
  progress: Progress[];
  categoryStats?: Record<ExerciceCategory, number>;
  onAddExercisesForDay: () => void;
  onReturnToToday: () => void;
};

export function DayDetailModalBody({
  date,
  exercises,
  progress,
  categoryStats,
  onAddExercisesForDay,
  onReturnToToday,
}: Props) {
  const { isTimeMachineMode } = useTimeContext();
  const formattedDate = date ? formatShortDate(date) : '';
  const isPastDay = date ? !isToday(date) : false;
  const isCurrentDay = date ? isToday(date) : false;
  const isFutureDay = date ? isAfter(startOfDay(date), startOfDay(new Date())) : false;
  const hasContent = exercises.length > 0 || progress.length > 0;
  const hasNoExercises = exercises.length === 0;
  const canAddExercises = useMemo(() => {
    if (!date || !isPastDay) return false;
    const today = startOfDay(new Date());
    if (isAfter(startOfDay(date), today)) return false;
    const minAllowedDate = subDays(new Date(), MAX_TIME_MACHINE_DAYS);
    return !isBefore(date, minAllowedDate);
  }, [date, isPastDay]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
      {isFutureDay && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏰</span>
          </div>
          <p className="text-gray-700 text-lg font-semibold">
            Tu ne peux pas aller dans le futur
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Le mode sablier permet uniquement de remonter dans le passé
          </p>
        </div>
      )}

      {!isFutureDay && (
        <>
          {categoryStats && Object.values(categoryStats).some(count => count > 0) && (
            <section className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Exercices faits par catégorie</h3>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_ORDER.map((category) => {
                  const count = categoryStats[category] || 0;
                  if (count === 0) return null;
                  const styles = CATEGORY_COLORS[category];
                  const icon = CATEGORY_ICONS[category];
                  const label = CATEGORY_LABELS_SHORT[category];
                  return (
                    <div
                      key={category}
                      className={clsx(
                        'flex items-center gap-2 px-3 py-2 rounded-lg',
                        styles.bg,
                        styles.border
                      )}
                    >
                      <span className="text-lg">{icon}</span>
                      <span className={clsx('text-sm font-medium flex-1', styles.text)}>{label}</span>
                      <span className={clsx('text-sm font-bold', styles.text)}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {progress.length > 0 && (
            <section>
              <BorderedIconList
                title="Progrès"
                titleId="day-detail-progress-label"
                ariaLabel="Liste des progrès enregistrés ce jour"
                items={progress.map((item) => ({
                  key: item.id,
                  label: item.content,
                  icon: PROGRESS_EMOJIS.STAR_BRIGHT,
                  borderClass: 'border-amber-200',
                  secondaryLabel: formatTime(item.createdAt),
                }))}
              />
            </section>
          )}

          {exercises.length > 0 && (
            <section>
              <BorderedIconList
                title="Exercices faits"
                titleId="day-detail-exercices-label"
                ariaLabel="Liste des exercices faits ce jour"
                items={exercises.map((exercise) => {
                  const colors = CATEGORY_COLORS[exercise.category];
                  return {
                    key: String(exercise.id),
                    label: exercise.name,
                    icon: CATEGORY_ICONS[exercise.category],
                    borderClass: colors?.border || 'border-gray-200',
                    completed: true,
                  };
                })}
              />
            </section>
          )}

          {!hasContent && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">{NAVIGATION_EMOJIS.CLIPBOARD}</span>
              </div>
              <p className="text-gray-700 text-lg font-semibold">
                {hasNoExercises && isPastDay
                  ? 'Pas d’exercice ce jour-là'
                  : 'Jour de repos'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {hasNoExercises && isPastDay
                  ? canAddExercises
                    // Gentle, no guilt: the date is already the sheet title.
                    ? 'Tu en as fait sans les cocher ? Tu peux les ajouter.'
                    : `Tu ne peux remonter que jusqu'à ${MAX_TIME_MACHINE_DAYS} jours en arrière`
                  : "Chaque jour est différent, c'est ok !"}
              </p>
              {hasNoExercises && isPastDay && canAddExercises && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={onAddExercisesForDay}
                    className={clsx(
                      'px-6 py-3',
                      '!bg-indigo-700 !hover:bg-indigo-600 !active:bg-indigo-900',
                      '!text-white font-bold',
                      '!border-2 !border-indigo-500',
                      'shadow-lg shadow-indigo-500/30 transition-shadow'
                    )}
                  >
                    <span className="mr-2 text-lg">{NAVIGATION_EMOJIS.HOURGLASS}</span>
                    Ajouter des exercices pour ce jour
                  </Button>
                </div>
              )}
            </div>
          )}

          {isPastDay && hasContent && canAddExercises && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-4">
                  Tu veux modifier les exercices pour ce jour ?
                </p>
                <div className="flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={onAddExercisesForDay}
                    className={clsx(
                      'px-6 py-3',
                      '!bg-indigo-700 !hover:bg-indigo-600 !active:bg-indigo-900',
                      '!text-white font-bold',
                      '!border-2 !border-indigo-500',
                      'shadow-lg shadow-indigo-500/30 transition-shadow'
                    )}
                  >
                    <span className="mr-2 text-lg">{NAVIGATION_EMOJIS.HOURGLASS}</span>
                    Modifier les exercices pour ce jour
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isTimeMachineMode && isCurrentDay && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-4">
                  Tu es en mode sablier. Revenir à aujourd&apos;hui ?
                </p>
                <div className="flex justify-center">
                  <Button
                    variant="action"
                    onClick={onReturnToToday}
                    className={clsx(
                      'px-6 py-3',
                      '!bg-emerald-500 !hover:bg-emerald-600 !active:bg-emerald-700',
                      '!text-white font-bold',
                      'shadow-md hover:shadow-lg transition-shadow'
                    )}
                  >
                    <span className="mr-2 text-lg">🏠</span>
                    Revenir à aujourd&apos;hui
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
