'use client';

import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TouchLink } from '@/app/components/TouchLink';
import { ChevronIcon } from '@/app/components/ui/icons';
import type { JournalNote } from '@/app/types/journal';
import type { Progress } from '@/app/types/progress';

const rowClass = 'relative flex items-center gap-3 min-h-[64px] rounded-xl border border-gray-200 bg-white pl-4 pr-1.5';

type NoteRowProps = {
  note: JournalNote;
  /** Open in place (journal list) instead of navigating to the edit page. */
  onOpen?: () => void;
};

/** Pinned note as one line: a reminder, tap to open it. */
export function PinnedNoteRow({ note, onOpen }: NoteRowProps) {
  const subtitle = note.description?.split('\n')[0];

  const body = (
    <>
      <span className="text-xl shrink-0" aria-hidden="true">📝</span>
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold text-gray-800">
          {note.title || 'Note sans titre'}
        </span>
        {subtitle && <span className="block truncate text-sm text-gray-500">{subtitle}</span>}
      </span>
    </>
  );

  return (
    <div className={rowClass}>
      {onOpen ? (
        <button type="button" onClick={onOpen} aria-label={`Ouvrir la note ${note.title}`} className="flex flex-1 min-w-0 items-center gap-3 py-2.5 text-left">
          {body}
        </button>
      ) : (
        <TouchLink href={`/journal/edit/${note.id}`} className="flex flex-1 min-w-0 items-center gap-3 py-2.5">
          {body}
        </TouchLink>
      )}
      <ChevronIcon direction="right" className="w-4 h-4 mr-1.5 text-gray-300 shrink-0" />
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
