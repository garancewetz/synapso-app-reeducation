'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { JournalNoteCard } from './JournalNoteCard';
import { useJournalNotes } from '../hooks/useJournalNotes';
import { useExercices } from '@/app/features/exercices';
import { isNoteValidatedForDay } from '../hooks/useValidateJournalNote';
import { PinnedNoteRow } from '@/app/features/home/components/HomePinnedRows';

type Props = {
  limit?: number;
};

export function JournalNotesList({ limit }: Props) {
  const { notes, refetch } = useJournalNotes();
  const { exercices } = useExercices();
  const { referenceDateKey } = useTimeContext();

  // Set des IDs d'exercices complétés : progression générale + exercices des entrées validées pour le jour de référence
  const completedExerciceIds = useMemo(() => {
    const ids = new Set<number>();
    for (const ex of exercices) {
      if (ex.completed) ids.add(ex.id);
    }
    for (const note of notes) {
      if (referenceDateKey && isNoteValidatedForDay(note, referenceDateKey) && note.exercices?.length) {
        for (const ex of note.exercices) {
          ids.add(ex.id);
        }
      }
    }
    return ids;
  }, [exercices, notes, referenceDateKey]);

  const handleNoteUpdated = useCallback(() => {
    refetch();
  }, [refetch]);

  const displayedNotes = limit ? notes.slice(0, limit) : notes;

  // Notes are compact rows; tapping one unfolds the full card in place (edit,
  // image, linked exercises, pin, share, delete) — the list stays scannable.
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const toggle = useCallback((id: number) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <>
      {displayedNotes.length > 0 ? (
        <ul className="flex flex-col list-none p-0 m-0 gap-2">
          {displayedNotes.map((note) => (
            <li key={note.id}>
              {openIds.has(note.id) ? (
                <div className="space-y-1">
                  <JournalNoteCard
                    note={note}
                    completedExerciceIds={completedExerciceIds}
                    onUpdated={handleNoteUpdated}
                  />
                  <button
                    type="button"
                    onClick={() => toggle(note.id)}
                    className="w-full min-h-[44px] text-sm font-medium text-gray-500 underline underline-offset-4"
                  >
                    Réduire
                  </button>
                </div>
              ) : (
                <PinnedNoteRow note={note} onUpdated={handleNoteUpdated} onOpen={() => toggle(note.id)} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-500 text-center py-12 text-sm">
          Aucune note pour l’instant.
        </p>
      )}
    </>
  );
}
