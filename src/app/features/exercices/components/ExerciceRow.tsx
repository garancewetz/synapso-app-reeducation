'use client';

import { memo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import type { Exercice } from '@/app/types';
import { CATEGORY_COLORS } from '@/app/constants/exercice.constants';
import { useUser } from '@/app/contexts/UserContext';
import { CardActionButton, CardActionsPanel, InlineSpinner } from '@/app/components/ui';
import { BookmarkIcon, CheckIcon, DotsIcon, EditIcon, ShareIcon } from '@/app/components/ui/icons';
import { ShareToUserModal } from '@/app/features/sharing';
import { useCompleteExercice } from '../hooks/useCompleteExercice';
import { useExerciceCardActions } from '../hooks/useExerciceCardActions';
import { useExerciceCardMedia } from '../hooks/useExerciceCardMedia';
import { ExerciceCardTags } from './ExerciceCardTags';
import { ExerciceMedia } from './ExerciceMedia';
import { formatWorkoutSummary } from '../utils/workout.utils';

const LazyConfettiValidate = dynamic(
  () => import('./ConfettiValidate').then((mod) => ({ default: mod.ConfettiValidate })),
  { ssr: false }
);

type Props = {
  exercice: Exercice;
  onEdit?: (id: number) => void;
  onCompleted?: (updatedExercice: Exercice) => void;
  onArchive?: (updatedExercice: Exercice) => void;
};

/**
 * Checklist row for an exercise: name + what to do, a round check and ⋯.
 * Tap the row to read the instructions and see the photos. Several rows fit on
 * a phone screen (vs ~1.5 cards), so the list reads like "what's left to do".
 */
export const ExerciceRow = memo(function ExerciceRow({ exercice, onEdit, onCompleted, onArchive }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const { effectiveUser } = useUser();
  const userId = effectiveUser?.id ?? 0;
  const styles = CATEGORY_COLORS[exercice.category];
  const summary = formatWorkoutSummary(exercice.workout);
  const isDone = exercice.completed;

  const { handleComplete, isCompleting, showSuccess } = useCompleteExercice({
    exercice,
    userId,
    onCompleted: effectiveUser ? onCompleted : undefined,
  });

  const {
    isActionsOpen, isShareModalOpen, setIsShareModalOpen, isArchiving, isPinning,
    handleEdit, handleArchive, handlePinClick, handleShareClick, toggleActions,
  } = useExerciceCardActions({ exercice, userId, onEdit, onCompleted, onArchive, cardRef: rowRef });

  const { lightboxIndex, handleLightboxOpen, handleLightboxClose, hasPhotos } = useExerciceCardMedia(exercice.media);

  const hasDetails = Boolean(
    exercice.description.text || exercice.description.comment || hasPhotos ||
    exercice.bodyparts.length || exercice.equipments.length
  );

  return (
    <div
      ref={rowRef}
      className={clsx(
        'exercise-row relative rounded-xl border border-gray-200 overflow-hidden',
        isDone ? 'bg-gray-50' : 'bg-white'
      )}
    >
      {/* Zone colour, as on the cards */}
      <span className={clsx('absolute inset-y-0 left-0 w-1', isDone ? 'bg-gray-300' : styles.accent)} aria-hidden="true" />
      <div className="flex items-center gap-1 pl-4 pr-1.5 min-h-[64px]">
        <button
          type="button"
          onClick={() => hasDetails && setIsExpanded((open) => !open)}
          aria-expanded={hasDetails ? isExpanded : undefined}
          className="flex-1 min-w-0 py-2.5 text-left"
        >
          <span className={clsx('flex items-center gap-1.5 text-base font-semibold leading-snug', isDone ? 'text-gray-400' : 'text-gray-800')}>
            {exercice.pinned && <BookmarkIcon className="w-3.5 h-3.5 shrink-0 text-amber-500" filled />}
            <span className="exercise-row-name truncate">{exercice.name}</span>
          </span>
          {summary && (
            <span className={clsx('block text-sm', isDone ? 'text-gray-400' : 'text-gray-600')}>{summary}</span>
          )}
        </button>

        {exercice.archived ? (
          // Archived: ticking makes no sense — the useful action is to bring it back.
          <button
            type="button"
            onClick={handleArchive}
            disabled={isArchiving}
            aria-label={`Restaurer ${exercice.name}`}
            className="min-h-[44px] px-3 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 active:scale-95"
          >
            {isArchiving ? <InlineSpinner /> : 'Restaurer'}
          </button>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={handleComplete}
              disabled={isCompleting}
              aria-pressed={exercice.completedToday}
              aria-label={exercice.completedToday ? `Démarquer ${exercice.name}` : `Marquer ${exercice.name} comme fait`}
              className="flex items-center justify-center w-12 h-12 rounded-full active:scale-95 transition-transform"
            >
              <span
                className={clsx(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                  isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent'
                )}
              >
                {isCompleting ? <InlineSpinner /> : <CheckIcon className="w-4 h-4" />}
              </span>
            </button>
            {showSuccess && <LazyConfettiValidate show centerX={50} centerY={50} />}
          </div>
        )}

        <button
          type="button"
          onClick={toggleActions}
          aria-label={isActionsOpen ? 'Fermer les actions' : `Actions pour ${exercice.name}`}
          aria-expanded={isActionsOpen}
          className="flex items-center justify-center w-11 h-12 rounded-lg text-gray-400 active:bg-gray-100"
        >
          <DotsIcon className="w-5 h-5" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {hasPhotos && (
            <ExerciceMedia media={exercice.media} maxPhotos={3} onLightboxOpen={handleLightboxOpen} showLightbox={false} title={exercice.name} />
          )}
          {exercice.description.text && (
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">{exercice.description.text}</p>
          )}
          {exercice.description.comment && (
            <p className="p-3 bg-amber-50 border-l-2 border-amber-300 text-gray-700 text-sm rounded-r">
              <span className="font-semibold">Conseil : </span>
              {exercice.description.comment}
            </p>
          )}
          <ExerciceCardTags exercice={exercice} />
        </div>
      )}

      <CardActionsPanel isOpen={isActionsOpen}>
        <CardActionButton icon={<EditIcon className="w-5 h-5" />} label="Modifier" onClick={handleEdit} className="border-r border-b border-gray-200" />
        <CardActionButton
          icon={isPinning ? <InlineSpinner /> : <BookmarkIcon className="w-5 h-5" filled={exercice.pinned} />}
          label={exercice.pinned ? 'Désépingler' : 'Épingler'}
          onClick={handlePinClick}
          disabled={isPinning}
          className="border-b border-gray-200"
        />
        <CardActionButton icon={<ShareIcon className="w-5 h-5" />} label="Partager" onClick={handleShareClick} className="border-r border-gray-200" />
        <CardActionButton
          icon={isArchiving ? <InlineSpinner /> : <span className="text-xl">{exercice.archived ? '📤' : '📦'}</span>}
          label={exercice.archived ? 'Désarchiver' : 'Archiver'}
          onClick={handleArchive}
          disabled={isArchiving}
        />
      </CardActionsPanel>

      {hasPhotos && lightboxIndex !== null && (
        <ExerciceMedia
          media={exercice.media}
          maxPhotos={3}
          initialLightboxIndex={lightboxIndex}
          onLightboxClose={handleLightboxClose}
          onLightboxOpen={handleLightboxOpen}
          showThumbnails={false}
          title={exercice.name}
        />
      )}
      <ShareToUserModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} exerciceId={exercice.id} />
    </div>
  );
});
