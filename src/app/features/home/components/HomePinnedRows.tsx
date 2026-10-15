'use client';

import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TouchLink } from '@/app/components/TouchLink';
import { CheckIcon, ChevronIcon } from '@/app/components/ui/icons';
import { InlineSpinner } from '@/app/components/ui';
import { useUser } from '@/app/contexts/UserContext';
import { useTimeContext } from '@/app/contexts/TimeContext';
import { useValidateJournalNote } from '@/app/features/journal';
import type { JournalNote } from '@/app/types/journal';
import type { Progress } from '@/app/types/progress';

const rowClass = 'relative flex items-center gap-3 min-h-[64px] rounded-xl border border-gray-200 bg-white pl-4 pr-1.5';

type NoteRowProps = {
  note: JournalNote;
  onUpdated?: () => void;
};

/** Pinned note as one line: tap to open it, round check to validate it for today. */
export function PinnedNoteRow({ note, onUpdated }: NoteRowProps) {
  const { effectiveUser } = useUser();
  const { referenceDateKey } = useTimeContext();
  const { handleValidateOrUnvalidate, isValidating, isValidatedForReferenceDay } = useValidateJournalNote({
    note,
    userId: effectiveUser?.id ?? 0,
    targetDateKey: referenceDateKey,
    resetFrequency: effectiveUser?.resetFrequency,
    onCompleted: onUpdated,
  });
  const linked = note.exercices?.length ?? 0;
  const subtitle = linked > 0
    ? `${linked} exercice${linked > 1 ? 's' : ''} lié${linked > 1 ? 's' : ''}`
    : note.description?.split('\n')[0];

  return (
    <div className={rowClass}>
      <TouchLink href={`/journal/edit/${note.id}`} className="flex flex-1 min-w-0 items-center gap-3 py-2.5">
        <span className="text-xl shrink-0" aria-hidden="true">📝</span>
        <span className="min-w-0">
          <span className={clsx('block truncate text-base font-semibold', isValidatedForReferenceDay ? 'text-gray-400' : 'text-gray-800')}>
            {note.title || 'Note sans titre'}
          </span>
          {subtitle && <span className="block truncate text-sm text-gray-500">{subtitle}</span>}
        </span>
      </TouchLink>
      <button
        type="button"
        onClick={handleValidateOrUnvalidate}
        disabled={isValidating}
        aria-pressed={isValidatedForReferenceDay}
        aria-label={isValidatedForReferenceDay ? `Annuler la validation de ${note.title}` : `Valider ${note.title} pour aujourd'hui`}
        className="flex items-center justify-center w-12 h-12 rounded-full active:scale-95 transition-transform"
      >
        <span
          className={clsx(
            'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
            isValidatedForReferenceDay ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent'
          )}
        >
          {isValidating ? <InlineSpinner /> : <CheckIcon className="w-4 h-4" />}
        </span>
      </button>
    </div>
  );
}

type ProgressRowProps = {
  progress: Progress;
  onOpen?: (progress: Progress) => void;
};

/** Pinned progress (a win) as one line: tap to open it. */
export function PinnedProgressRow({ progress, onOpen }: ProgressRowProps) {
  return (
    <button type="button" onClick={() => onOpen?.(progress)} className={clsx(rowClass, 'w-full text-left pr-3')}>
      <span className="text-xl shrink-0" aria-hidden="true">{progress.emoji || '⭐'}</span>
      <span className="flex-1 min-w-0 py-2.5">
        <span className="block truncate text-base font-semibold text-gray-800">{progress.content}</span>
        <span className="block text-sm text-gray-500">{format(new Date(progress.createdAt), 'd MMMM', { locale: fr })}</span>
      </span>
      <ChevronIcon direction="right" className="w-4 h-4 text-gray-300 shrink-0" />
    </button>
  );
}
