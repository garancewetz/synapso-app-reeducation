'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/app/contexts/UserContext';
import { ErrorMessage, FormActions, Loader } from '@/app/components';
import { Button } from '@/app/components/ui';
import { ExerciceCategory, type MediaData } from '@/app/types/exercice';
import { useAllEquipments } from '@/app/hooks/useAllEquipments';
import { useExerciceFormMutations } from '@/app/features/exercices/hooks/useExerciceFormMutations';
import { ExerciceFormContent } from './ExerciceForm/ExerciceFormContent';

const EXERCICE_FORM_DRAFT_KEY = 'synapso_exercice_form_draft';
const ABANDON_CONFIRM_MESSAGE = 'Vous abandonnez votre brouillon ?';

type FormDataState = {
  name: string;
  descriptionText: string;
  descriptionComment: string;
  workoutRepeat: string;
  workoutSeries: string;
  workoutDuration: string;
  category: ExerciceCategory;
  bodyparts: string[];
  equipments: string[];
  media: MediaData | null;
};

type Draft = {
  formData: FormDataState;
};

function getDefaultFormData(initialCategory?: ExerciceCategory): FormDataState {
  return {
    name: '',
    descriptionText: '',
    descriptionComment: '',
    workoutRepeat: '',
    workoutSeries: '',
    workoutDuration: '',
    category: (initialCategory || 'UPPER_BODY') as ExerciceCategory,
    bodyparts: [],
    equipments: [],
    media: null,
  };
}

function hasDraft(formData: FormDataState): boolean {
  if (formData.name.trim()) return true;
  if (formData.descriptionText.trim() || formData.descriptionComment.trim()) return true;
  if (formData.workoutRepeat || formData.workoutSeries || formData.workoutDuration) return true;
  if (formData.bodyparts.length > 0 || formData.equipments.length > 0) return true;
  if (formData.media?.photos?.length || formData.media?.video) return true;
  return false;
}

function loadDraft(initialCategory?: ExerciceCategory): Draft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(EXERCICE_FORM_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (parsed && typeof parsed.formData === 'object') {
      return {
        formData: { ...getDefaultFormData(initialCategory), ...parsed.formData, media: null },
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function saveDraft(draft: Draft): void {
  try {
    const toSave = {
      ...draft,
      formData: { ...draft.formData, media: null },
    };
    localStorage.setItem(EXERCICE_FORM_DRAFT_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(EXERCICE_FORM_DRAFT_KEY);
  } catch {
    // ignore
  }
}

type Props = {
  exerciceId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialCategory?: ExerciceCategory;
  /** Create a new exercise pre-filled from this one (« Dupliquer »). */
  duplicateFromId?: number;
};

export function ExerciceForm({ exerciceId, onSuccess, onCancel, initialCategory, duplicateFromId }: Props) {
  const { effectiveUser } = useUser();
  const { equipments: allEquipments, equipmentIconsMap, loading: loadingEquipments } = useAllEquipments();

  const isCreateMode = !exerciceId;
  const sourceId = exerciceId ?? duplicateFromId;
  const draft = isCreateMode && !duplicateFromId ? loadDraft(initialCategory) : null;

  const [formData, setFormData] = useState<FormDataState>(() =>
    draft ? draft.formData : getDefaultFormData(initialCategory)
  );
  const [initialLoading, setInitialLoading] = useState(!!sourceId);
  const userId = effectiveUser?.id;
  const loadedSourceRef = useRef<number | null>(null);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSuccess = useCallback(() => {
    if (isCreateMode) clearDraft();
    onSuccess?.();
  }, [isCreateMode, onSuccess]);

  const { createOrUpdateMutation, deleteMutation, handleSubmit, handleDelete } = useExerciceFormMutations({
    exerciceId,
    formData,
    setError,
    onSuccess: handleSuccess,
  });

  const hasUnsavedDraft = isCreateMode && hasDraft(formData);

  useEffect(() => {
    if (!isCreateMode) return;
    saveDraft({ formData });
  }, [isCreateMode, formData]);

  useEffect(() => {
    if (!hasUnsavedDraft) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedDraft]);

  useEffect(() => {
    // Load once per exercise: depending on the effectiveUser object made every user
    // refetch (e.g. after the persisted cache restores) reload the exercise and wipe
    // what was being typed.
    if (sourceId && userId && loadedSourceRef.current !== sourceId) {
      loadedSourceRef.current = sourceId;
      fetch(`/api/exercices/${sourceId}?userId=${userId}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          const isDuplicate = !exerciceId;
          setFormData({
            name: isDuplicate ? `${data.name || ''} (copie)` : data.name || '',
            descriptionText: data.description?.text || '',
            descriptionComment: data.description?.comment || '',
            workoutRepeat: data.workout?.repeat || '',
            workoutSeries: data.workout?.series || '',
            workoutDuration: data.workout?.duration || '',
            category: data.category || 'UPPER_BODY',
            bodyparts: data.bodyparts || [],
            equipments: data.equipments || [],
            // Never share photos with a copy: deleting one would delete the other's
            // Cloudinary files.
            media: isDuplicate ? null : data.media || null,
          });
        })
        .catch(() => {
          setError('Erreur lors du chargement de l\'exercice');
        })
        .finally(() => {
          setInitialLoading(false);
        });
    }
  }, [sourceId, exerciceId, userId]);

  const toggleBodypart = (bodypart: string) => {
    setFormData((prev) => ({
      ...prev,
      bodyparts: prev.bodyparts.includes(bodypart)
        ? prev.bodyparts.filter((bp) => bp !== bodypart)
        : [...prev.bodyparts, bodypart],
    }));
  };

  const toggleEquipment = (equipment: string) => {
    setFormData((prev) => ({
      ...prev,
      equipments: prev.equipments.includes(equipment)
        ? prev.equipments.filter((eq) => eq !== equipment)
        : [...prev.equipments, equipment],
    }));
  };

  const addNewEquipment = (equipment: string) => {
    if (!formData.equipments.includes(equipment)) {
      setFormData((prev) => ({
        ...prev,
        equipments: [...prev.equipments, equipment],
      }));
    }
  };

  const onDeleteClick = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    handleDelete(() => setShowDeleteConfirm(false));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="xl" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorMessage message={error} />

      <ExerciceFormContent
        formData={formData}
        setFormData={setFormData}
        toggleBodypart={toggleBodypart}
        toggleEquipment={toggleEquipment}
        addNewEquipment={addNewEquipment}
        allEquipments={allEquipments}
        equipmentIconsMap={equipmentIconsMap}
        loadingEquipments={loadingEquipments}
      />

      {/* Main action first, under the thumb; cancelling is the secondary choice. */}
      <FormActions
        loading={createOrUpdateMutation.isPending || deleteMutation.isPending}
        onSubmitLabel={exerciceId ? 'Enregistrer les modifications' : 'Créer l\'exercice'}
        onCancel={() => {
          if (hasUnsavedDraft && !window.confirm(ABANDON_CONFIRM_MESSAGE)) return;
          if (isCreateMode) clearDraft();
          onCancel?.();
        }}
      />

      {exerciceId && (
        <div className="pt-2 border-t border-gray-200">
          <Button
            variant={showDeleteConfirm ? 'danger' : 'danger-outline'}
            onClick={onDeleteClick}
            disabled={createOrUpdateMutation.isPending || deleteMutation.isPending}
            className="w-full"
          >
            {showDeleteConfirm ? '⚠️ Confirmer la suppression' : "Supprimer l'exercice"}
          </Button>
        </div>
      )}
    </form>
  );
}
