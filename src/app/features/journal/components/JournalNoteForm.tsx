'use client';

import { useState, useEffect, useCallback } from 'react';
import { ErrorMessage, FormActions } from '@/app/components';
import { Input, Textarea, MediaUploader } from '@/app/components/ui';
import { useJournalForm } from '../hooks/useJournalForm';
import { useFormData } from '@/app/hooks/forms/useFormData';
import type { MediaItem } from '@/app/types/exercice';

type NoteFormData = {
  title: string;
  description: string;
};

type InitialNoteData = NoteFormData & {
  media?: MediaItem[];
};

type Props = {
  noteId?: number;
  onSuccess?: (createdNoteId?: number) => void;
  onCancel?: () => void;
};

export function JournalNoteForm({ noteId, onSuccess, onCancel }: Props) {
  const [formData, setFormData] = useState<NoteFormData>({
    title: '',
    description: '',
  });
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasAutoSavedOnce, setHasAutoSavedOnce] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState<number | undefined>(undefined);

  const effectiveNoteId = noteId ?? createdNoteId;

  const { formData: initialData, loading: loadingInitial } = useFormData<InitialNoteData>({
    entityId: noteId,
    fetchUrl: `/api/journal/notes/${noteId}`,
    transform: (data) => {
      const noteData = data as {
        title?: string;
        description?: string;
        media?: MediaItem[] | null;
      };
      return {
        title: noteData.title || '',
        description: noteData.description || '',
        media: noteData.media || [],
      };
    },
  });

  const {
    loading,
    error,
    showDeleteConfirm,
    handleSubmit: handleFormSubmit,
    handleDelete,
  } = useJournalForm<NoteFormData>({
    entityId: effectiveNoteId,
    createUrl: '/api/journal/notes',
    updateUrl: `/api/journal/notes/${effectiveNoteId}`,
    deleteUrl: `/api/journal/notes/${effectiveNoteId}`,
    onSuccess,
    transformToApi: (data) => ({
      title: data.title,
      description: data.description,
      media,
    }),
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ title: initialData.title, description: initialData.description });
      if (initialData.media) {
        setMedia(initialData.media);
      }
    }
  }, [initialData]);

  const handleTitleChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, title: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleMediaChange = useCallback((items: MediaItem[]) => {
    setMedia(items);
    setHasUnsavedChanges(true);
  }, []);

  useEffect(() => {
    if (!effectiveNoteId) {
      return;
    }

    if (!hasUnsavedChanges) {
      return;
    }

    if (!formData.title.trim()) {
      return;
    }

    setIsAutoSaving(true);

    const timeoutId = window.setTimeout(async () => {
      const createdId = await handleFormSubmit(formData);
      if (createdId != null) {
        setCreatedNoteId(createdId);
      }
      setIsAutoSaving(false);
      setHasUnsavedChanges(false);
      setHasAutoSavedOnce(true);
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [effectiveNoteId, formData, hasUnsavedChanges, handleFormSubmit]);

  const autosaveMessage =
    isAutoSaving || loading
      ? 'Enregistrement en cours...'
      : hasAutoSavedOnce && !hasUnsavedChanges
        ? 'Note enregistrée automatiquement.'
        : '';

  const handleFinish = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const createdId = await handleFormSubmit(formData);

      if (onSuccess) {
        onSuccess(createdId ?? undefined);
      }
    },
    [formData, handleFormSubmit, onSuccess]
  );

  return (
    <>
      <form className="space-y-4" onSubmit={handleFinish}>
        <ErrorMessage message={error} />

        <Input
          speech
          label="Titre"
          type="text"
          required
          value={formData.title}
          onValueChange={handleTitleChange}
          placeholder="Titre de la note"
          disabled={loadingInitial}
        />

        <Textarea
          speech
          label="Description"
          rows={4}
          value={formData.description}
          onValueChange={handleDescriptionChange}
          placeholder="Description (optionnel)"
          disabled={loadingInitial}
        />

        <MediaUploader
          value={media}
          onChange={handleMediaChange}
          maxItems={1}
          multiple={false}
        />

        <FormActions
          loading={loading || loadingInitial}
          onCancel={onCancel}
          showSubmit={!effectiveNoteId}
          onSubmitLabel="Terminer"
          showDelete={!!effectiveNoteId}
          onDelete={handleDelete}
          deleteConfirm={showDeleteConfirm}
          deleteLabel="Supprimer la note"
          deleteConfirmLabel="Confirmer la suppression"
        />

        {autosaveMessage && <p>{autosaveMessage}</p>}
      </form>

    </>
  );
}
