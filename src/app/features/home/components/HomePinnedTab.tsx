import { memo, useCallback } from 'react';
import { ExerciceRow } from '@/app/features/exercices';
import { PinnedNoteRow, PinnedProgressRow } from './HomePinnedRows';
import { BookmarkIcon } from '@/app/components/ui/icons';
import type { Exercice } from '@/app/types/exercice';
import type { Progress } from '@/app/types/progress';
import type { JournalNote } from '@/app/types/journal';

type Props = {
  pinnedExercices: Exercice[];
  pinnedProgress: Progress[];
  pinnedNotes?: JournalNote[];
  onEdit?: (id: number) => void;
  onEditProgress?: (progress: Progress) => void;
  onCompleted?: (updatedExercice: Exercice) => void;
  onArchive?: (updatedExercice: Exercice) => void;
  onNoteUpdated?: () => void;
};

export const HomePinnedTab = memo(function HomePinnedTab({
  pinnedExercices,
  pinnedProgress,
  pinnedNotes = [],
  onEdit,
  onEditProgress,
  onCompleted,
  onArchive,
  onNoteUpdated,
}: Props) {
  const handleNoteUpdated = useCallback(() => {
    if (onNoteUpdated) {
      onNoteUpdated();
    }
  }, [onNoteUpdated]);

  const isEmpty = pinnedExercices.length === 0 && pinnedProgress.length === 0 && pinnedNotes.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookmarkIcon className="w-8 h-8 text-gray-300 mb-3" filled={false} />
        <p className="text-sm text-gray-500">
          Aucun élément épinglé.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Utilise le menu d&apos;un exercice, progrès ou note pour l&apos;épingler.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pinnedExercices.length > 0 && (
        <section aria-labelledby="pinned-exercices-heading">
          <h2 id="pinned-exercices-heading" className="text-sm font-medium text-gray-500 mb-2">
            Exercices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {pinnedExercices.map(ex => (
              <ExerciceRow
                key={`ex-${ex.id}`}
                exercice={ex}
                onEdit={onEdit}
                onCompleted={onCompleted}
                onArchive={onArchive}
              />
            ))}
          </div>
        </section>
      )}
      {pinnedProgress.length > 0 && (
        <section aria-labelledby="pinned-progress-heading">
          <h2 id="pinned-progress-heading" className="text-sm font-medium text-gray-500 mb-2">
            Progrès
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {pinnedProgress.map(progress => (
              <PinnedProgressRow key={`progress-${progress.id}`} progress={progress} onOpen={onEditProgress} />
            ))}
          </div>
        </section>
      )}
      {pinnedNotes.length > 0 && (
        <section aria-labelledby="pinned-notes-heading">
          <h2 id="pinned-notes-heading" className="text-sm font-medium text-gray-500 mb-2">
            Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {pinnedNotes.map(note => (
              <PinnedNoteRow key={`note-${note.id}`} note={note} onUpdated={handleNoteUpdated} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
});
