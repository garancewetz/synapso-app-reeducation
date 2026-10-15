'use client';

import { useState, useEffect, useCallback } from 'react';
import { ErrorMessage, FormActions } from '@/app/components';
import { Input, Textarea, MediaUploader } from '@/app/components/ui';
import { Button } from '@/app/components/ui/Button';
import { useJournalForm } from '../hooks/useJournalForm';
import { useFormData } from '@/app/hooks/forms/useFormData';
import { ExercicePickerModal } from './ExercicePickerModal';
import { CATEGORY_COLORS } from '@/app/constants/exercice.constants';
import type { MediaItem, ExerciceCategory } from '@/app/types/exercice';
import type { LinkedExercice } from '@/app/types/journal';

type NoteFormData = {
  title: string;
  description: string;
};

type InitialNoteData = NoteFormData & {
  media?: MediaItem[];
  exercices?: LinkedExercice[];
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
  const [exerciceIds, setExerciceIds] = useState<number[]>([]);
  const [exerciceNames, setExerciceNames] = useState<LinkedExercice[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
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
        exercices?: LinkedExercice[] | null;
      };
      return {
        title: noteData.title || '',
        description: noteData.description || '',
        media: noteData.media || [],
        exercices: noteData.exercices || [],
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
      exerciceIds,
    }),
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ title: initialData.title, description: initialData.description });
      if (initialData.media) {
        setMedia(initialData.media);
      }
      if (initialData.exercices) {
        setExerciceIds(initialData.exercices.map((e) => e.id));
        setExerciceNames(initialData.exercices);
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

  const handleExerciceChange = useCallback((selected: LinkedExercice[]) => {
    setExerciceIds(selected.map((e) => e.id));
    setExerciceNames(selected);
    setHasUnsavedChanges(true);
  }, []);

  const removeExercice = useCallback((id: number) => {
    setExerciceIds((prev) => prev.filter((eid) => eid !== id));
    setExerciceNames((prev) => prev.filter((e) => e.id !== id));
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

        {/* Exercices liés */}
        <div>
          <p className="text-xs text-gray-500 text-center mb-2">Exercices liés (optionnel)</p>

          {exerciceNames.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {exerciceNames.map((ex) => {
                const colors = CATEGORY_COLORS[ex.category as ExerciceCategory];
                return (
                  <span
                    key={ex.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colors?.tag || 'bg-gray-100 text-gray-600'}`}
                  >
                    {ex.name}
                    <button
                      type="button"
                      onClick={() => removeExercice(ex.id)}
                      className="ml-0.5 hover:opacity-70"
                      aria-label={`Retirer ${ex.name}`}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            rounded="lg"
            onClick={() => setIsPickerOpen(true)}
            className="w-full"
          >
            {exerciceIds.length > 0 ? 'Modifier les exercices liés' : 'Lier des exercices'}
          </Button>
        </div>

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

      <ExercicePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        value={exerciceIds}
        onChange={handleExerciceChange}
      />
    </>
  );
}
