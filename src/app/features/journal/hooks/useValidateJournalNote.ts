import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { JournalNote } from '@/app/types';
import { getDateKey } from '@/app/utils/date.utils';
import { queryKeys } from '@/app/lib/api-queries';

type UseValidateJournalNoteOptions = {
  note: JournalNote;
  userId: number;
  targetDateKey: string;
  resetFrequency?: 'DAILY' | 'WEEKLY';
  onCompleted?: (updatedNote: JournalNote) => void;
};

type UseValidateJournalNoteReturn = {
  handleValidateOrUnvalidate: (e?: React.MouseEvent) => Promise<void>;
  isValidating: boolean;
  isValidatedForReferenceDay: boolean;
};

export function isNoteValidatedForDay(note: JournalNote, referenceDateKey: string): boolean {
  if (!note.validatedAt) return false;
  const validatedDayKey = getDateKey(note.validatedAt);
  return validatedDayKey === referenceDateKey;
}

export function useValidateJournalNote({
  note,
  userId,
  targetDateKey,
  resetFrequency = 'DAILY',
  onCompleted,
}: UseValidateJournalNoteOptions): UseValidateJournalNoteReturn {
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();
  const isValidatedForReferenceDay = isNoteValidatedForDay(note, targetDateKey);

  const handleValidateOrUnvalidate = useCallback(
    async (e?: React.MouseEvent) => {
      e?.stopPropagation();

      if (!userId) return;

      setIsValidating(true);
      try {
        const body: { targetDate: string; resetFrequency: string; validated?: boolean } = {
          targetDate: targetDateKey,
          resetFrequency,
        };
        if (isValidatedForReferenceDay) {
          body.validated = false;
        }

        const response = await fetch(`/api/journal/notes/${note.id}/validate`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          const updatedNote: JournalNote = {
            ...note,
            validated: data.validated,
            validatedAt: data.validatedAt ?? null,
          };

          queryClient.setQueryData<JournalNote[]>(queryKeys.journalNotes.list(), (prev) =>
            prev?.map((n) => (n.id === updatedNote.id ? updatedNote : n)) ?? prev
          );
          await queryClient.invalidateQueries({ queryKey: queryKeys.journalNotes.all });
          if (note.exercices && note.exercices.length > 0) {
            await queryClient.invalidateQueries({ queryKey: queryKeys.exercices.all });
            await queryClient.invalidateQueries({ queryKey: queryKeys.history.all });
            await queryClient.invalidateQueries({ queryKey: queryKeys.categoryStats.all });
          }

          onCompleted?.(updatedNote);
        }
      } catch (error) {
        console.error('Erreur lors de la validation ou dévalidation:', error);
      } finally {
        setIsValidating(false);
      }
    },
    [
      note,
      userId,
      targetDateKey,
      resetFrequency,
      isValidatedForReferenceDay,
      onCompleted,
      queryClient,
    ]
  );

  return {
    handleValidateOrUnvalidate,
    isValidating,
    isValidatedForReferenceDay,
  };
}
