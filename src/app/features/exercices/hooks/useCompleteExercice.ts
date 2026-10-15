'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { Exercice } from '@/app/types';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { useUser } from '@/app/contexts/UserContext';
import { useToast } from '@/app/contexts/ToastContext';
import { useConfetti } from '@/app/contexts/ConfettiContext';
import { queryKeys } from '@/app/lib/api-queries';

type UseCompleteExerciceOptions = {
  exercice: Exercice;
  userId: number;
  onCompleted?: (updatedExercice: Exercice) => void;
};

type UseCompleteExerciceReturn = {
  handleComplete: (e: React.MouseEvent) => void;
  isCompleting: boolean;
  showSuccess: boolean;
};

export function useCompleteExercice({
  exercice,
  userId,
  onCompleted,
}: UseCompleteExerciceOptions): UseCompleteExerciceReturn {
  const [showSuccess, setShowSuccess] = useState(false);
  const { referenceDateKey } = useTimeContext();
  const { effectiveUser } = useUser();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { requestConfetti } = useConfetti();

  const targetDate = referenceDateKey || format(new Date(), 'yyyy-MM-dd');
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/exercices/${exercice.id}/complete?userId=${userId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completedAt: targetDate,
            resetFrequency: effectiveUser?.resetFrequency || 'DAILY',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const weeklyCompletionsRaw = data.weeklyCompletions || [];
      const weeklyCompletions = weeklyCompletionsRaw.map((d: Date | string) =>
        typeof d === 'string' ? new Date(d) : d
      );

      const updatedExercice: Exercice = {
        ...exercice,
        completed: data.completed,
        completedToday: data.completedToday ?? false,
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        weeklyCompletions,
      };

      if (!exercice.completedToday && updatedExercice.completedToday && requestConfetti('low')) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      }

      onCompleted?.(updatedExercice);

      // Invalider exercices (sauf les listes includeArchived:true utilisées pour les vues globales/épinglées)
      // + history. Les listes includeArchived:true sont déjà tenues à jour
      // de façon optimiste via updateExercice (voir useExercices → updateExercice).
      queryClient.invalidateQueries({
        queryKey: ['exercices', 'list'],
        predicate: (query) => {
          const filters = query.queryKey[2] as { targetDate?: string; includeArchived?: boolean } | undefined;
          if (filters?.includeArchived) {
            return false;
          }
          if (!filters?.targetDate) return true;
          return filters.targetDate === targetDate;
        },
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.history.all });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    },
  });

  const handleComplete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (userId) {
        mutate();
      }
    },
    [userId, mutate]
  );

  return {
    handleComplete,
    isCompleting: isPending,
    showSuccess,
  };
}
