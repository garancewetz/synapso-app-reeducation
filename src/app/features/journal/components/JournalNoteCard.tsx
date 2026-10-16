'use client';

import { useState, memo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { JournalNote } from '@/app/types';
import type { MediaItem } from '@/app/types/exercice';
import { useUser } from '@/app/contexts/UserContext';
import { usePinJournalNote } from '../hooks/usePinJournalNote';
import { useShareJournalNote } from '../hooks/useShareJournalNote';
import { Button, CardActionButton, CardActionsPanel, InlineSpinner } from '@/app/components/ui';
import { MediaUploader } from '@/app/components/ui';
import { DotsIcon, BookmarkIcon, ShareIcon, CameraIcon } from '@/app/components/ui/icons';
import { TrashIcon } from '@/app/components/ui/icons/TrashIcon';
import { JOURNAL_NOTE_STYLES } from '@/app/constants/journal.constants';
import clsx from 'clsx';

type Props = {
  note: JournalNote;
  onUpdated?: (updatedNote?: JournalNote) => void;
};

export const JournalNoteCard = memo(function JournalNoteCard({
  note,
  onUpdated,
}: Props) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [description, setDescription] = useState(note.description ?? '');
  const [media, setMedia] = useState<MediaItem[]>(Array.isArray(note.media) ? (note.media as MediaItem[]) : []);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasAutoSavedOnce, setHasAutoSavedOnce] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const skipNextNoteResetRef = useRef(false);
  const { effectiveUser } = useUser();

  const { handlePin, isPinning } = usePinJournalNote({
    note,
    userId: effectiveUser?.id ?? 0,
    onCompleted: onUpdated,
  });

  const { handleShare } = useShareJournalNote(note);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setHasUnsavedChanges(true);
  }, []);

  const resizeDescription = useCallback(() => {
    const el = descriptionRef.current;
    if (!el) return;

    const value = el.value;
    const lineCount = value.split('\n').length;
    const isEmpty = value.trim() === '';
    const minHeight = isEmpty || lineCount <= 1 ? 40 : 80;

    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  }, []);

  useLayoutEffect(() => {
    resizeDescription();
  }, [description, resizeDescription]);

  const handleMediaChange = useCallback((items: MediaItem[]) => {
    setMedia(items);
    setHasUnsavedChanges(true);
  }, []);


  const handleAddMediaClick = useCallback(() => {
    setShowMediaUploader(true);
    setIsActionsOpen(false);
  }, []);


  const handlePinClick = useCallback(async () => {
    await handlePin();
    setIsActionsOpen(false);
  }, [handlePin]);

  const toggleActions = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActionsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isActionsOpen) {
      setShowDeleteConfirm(false);
    }
  }, [isActionsOpen]);

  const handleDeleteClick = useCallback(async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/journal/notes/${note.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        onUpdated?.();
        setIsActionsOpen(false);
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [showDeleteConfirm, note.id, onUpdated]);

  useEffect(() => {
    if (!isActionsOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const element = cardRef.current;
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      const willMenuBeHidden = rect.bottom > viewportHeight;

      if (!willMenuBeHidden) {
        return;
      }

      const documentHeight = document.documentElement.scrollHeight;
      const currentScrollTop = window.scrollY || window.pageYOffset;
      const targetTop = Math.min(
        Math.max(currentScrollTop + rect.top - viewportHeight * 0.3, 0),
        documentHeight - viewportHeight
      );

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isActionsOpen]);

  useEffect(() => {
    if (skipNextNoteResetRef.current) {
      skipNextNoteResetRef.current = false;
      return;
    }
    setTitle(note.title);
    setDescription(note.description ?? '');
    setMedia(Array.isArray(note.media) ? (note.media as MediaItem[]) : []);
    setHasUnsavedChanges(false);
    setHasAutoSavedOnce(false);
    setShowMediaUploader((prev) => prev || (Array.isArray(note.media) && (note.media as MediaItem[]).length > 0));
  }, [note]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const isEmpty =
      !title.trim() &&
      !description.trim() &&
      media.length === 0;

    setIsAutoSaving(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        if (isEmpty) {
          const response = await fetch(`/api/journal/notes/${note.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (response.ok) {
            onUpdated?.();
          }
          setHasUnsavedChanges(false);
          return;
        }

        if (!title.trim()) {
          setIsAutoSaving(false);
          return;
        }

        const response = await fetch(`/api/journal/notes/${note.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            description,
            media,
          }),
        });

        if (response.ok) {
          const updatedNote = await response.json() as JournalNote;
          skipNextNoteResetRef.current = true;
          setHasAutoSavedOnce(true);
          setHasUnsavedChanges(false);
          onUpdated?.(updatedNote);
        }
      } finally {
        setIsAutoSaving(false);
      }
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [description, hasUnsavedChanges, media, note.id, onUpdated, title]);

  return (
    <>
      <article
        role="article"
        aria-label={`Entrée : ${note.title}`}
        className={clsx('flex flex-col', JOURNAL_NOTE_STYLES.block)}
        ref={cardRef}
      >
        <div className="flex-1">
          <div className={JOURNAL_NOTE_STYLES.contentArea}>
            <div className="flex items-start justify-between gap-2">
              <h2 className={clsx('flex-1 min-w-0 focus-within:ring-0 focus-within:outline-none', JOURNAL_NOTE_STYLES.title)}>
                <textarea
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Titre"
                  rows={1}
                  style={{ fieldSizing: 'content' }}
                  className="w-full border-0! bg-transparent p-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none placeholder:text-neutral-400 resize-none"
                />
              </h2>
              <div className="flex items-center gap-1.5 shrink-0">
                {note.pinned && (
                  <BookmarkIcon className="w-4 h-4 text-amber-500" filled />
                )}
              </div>
            </div>

            <div className="mt-3">
              <textarea
                ref={descriptionRef}
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Écrire une note..."
                className={clsx('w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none placeholder:text-neutral-400', JOURNAL_NOTE_STYLES.body)}
              />
            </div>
            {showMediaUploader && (
              <div className="mt-3">
                <MediaUploader
                  value={media}
                  onChange={handleMediaChange}
                  maxItems={1}
                  multiple={false}
                />
              </div>
            )}
            <div className={clsx('mt-3 flex flex-wrap items-center gap-x-3 gap-y-1', JOURNAL_NOTE_STYLES.meta)}>
              {note.date && (
                <span>
                  {new Date(note.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
              {isAutoSaving && <span>Enregistrement…</span>}
              {!isAutoSaving && hasAutoSavedOnce && !hasUnsavedChanges && <span>Enregistrée</span>}
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <div className={clsx(JOURNAL_NOTE_STYLES.footer, 'gap-2 justify-end')}>
              <div className="flex items-center gap-1 order-2">
                <Button
                  iconOnly
                  onClick={toggleActions}
                  aria-label={isActionsOpen ? 'Fermer les actions' : 'Ouvrir les actions'}
                  aria-expanded={isActionsOpen}
                  className="shrink-0"
                >
                  <DotsIcon className={clsx('w-5 h-5 transition-transform duration-200', isActionsOpen && 'rotate-90')} />
                </Button>
              </div>
            </div>

            {/* Actions inline */}
            <CardActionsPanel isOpen={isActionsOpen} color="neutral">
                  <CardActionButton
                    icon={<CameraIcon className="w-5 h-5" />}
                    label={media.length > 0 ? 'Modifier l\'image' : 'Ajouter une image'}
                    onClick={handleAddMediaClick}
                    color="neutral"
                    className={clsx('border-r', JOURNAL_NOTE_STYLES.actionsBorder)}
                  />
                  <CardActionButton
                    icon={isPinning
                      ? <InlineSpinner color="neutral" />
                      : <BookmarkIcon className="w-5 h-5" filled={note.pinned} />
                    }
                    label={note.pinned ? 'Désépingler' : 'Épingler'}
                    onClick={handlePinClick}
                    disabled={isPinning}
                    color="neutral"
                  />
                  <CardActionButton
                    icon={<ShareIcon className="w-5 h-5" />}
                    label="Partager"
                    onClick={handleShare}
                    color="neutral"
                    className={clsx('col-span-2 border-t', JOURNAL_NOTE_STYLES.actionsBorder)}
                  />
                  <CardActionButton
                    icon={isDeleting
                      ? <InlineSpinner color="neutral" />
                      : <TrashIcon className="w-5 h-5" />
                    }
                    label={showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer l\'entrée'}
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className={clsx(
                      'col-span-2 border-t',
                      JOURNAL_NOTE_STYLES.actionsBorder,
                      showDeleteConfirm ? 'text-red-600' : 'text-neutral-600'
                    )}
                    aria-label={showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer l\'entrée'}
                  />
            </CardActionsPanel>
          </div>
        </div>
      </article>
    </>
  );
});
