'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Input, Textarea, MediaUploader } from '@/app/components/ui';
import { ChevronIcon } from '@/app/components/ui/icons';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS_SHORT,
  CATEGORY_ORDER,
} from '@/app/constants/exercice.constants';
import type { ExerciceCategory, MediaData } from '@/app/types/exercice';
import { ExerciceFormBodyparts } from './ExerciceFormBodyparts';
import { ExerciceFormEquipments } from './ExerciceFormEquipments';
import { StepperField } from './StepperField';
import { DurationPicker } from './DurationPicker';

type FormData = {
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

type Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  toggleBodypart: (bodypart: string) => void;
  toggleEquipment: (equipment: string) => void;
  addNewEquipment: (equipment: string) => void;
  allEquipments: string[];
  equipmentIconsMap: Record<string, string>;
  loadingEquipments: boolean;
};

const hasDetails = (data: FormData) =>
  Boolean(
    data.descriptionText.trim() || data.descriptionComment.trim() || data.bodyparts.length ||
    data.equipments.length || data.media?.photos?.length
  );

/**
 * Short by default: name + zone + "how much" (steppers and duration chips, no
 * keyboard needed) is enough to create an exercise. Everything else lives behind
 * « + Ajouter des détails », opened automatically when an exercise already has some.
 */
export function ExerciceFormContent({
  formData,
  setFormData,
  toggleBodypart,
  toggleEquipment,
  addNewEquipment,
  allEquipments,
  equipmentIconsMap,
  loadingEquipments,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(() => hasDetails(formData));
  // Edit mode: the exercise loads after the first render — open details once it has some.
  const autoOpened = useRef(detailsOpen);
  const filled = hasDetails(formData);
  useEffect(() => {
    if (filled && !autoOpened.current) {
      autoOpened.current = true;
      setDetailsOpen(true);
    }
  }, [filled]);
  const update = (patch: Partial<FormData>) => setFormData((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-6">
      <Input
        speech
        label="Nom de l'exercice"
        required
        placeholder="Ex : Pont fessier"
        value={formData.name}
        onValueChange={(name) => update({ name })}
      />

      <div>
        <span className="block text-base font-medium text-gray-800 mb-2">Zone</span>
        <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Zone">
          {CATEGORY_ORDER.map((category) => {
            const isSelected = formData.category === category;
            const colors = CATEGORY_COLORS[category];
            return (
              <button
                key={category}
                type="button"
                onClick={() => update({ category })}
                aria-pressed={isSelected}
                className={clsx(
                  'flex flex-col items-center justify-center gap-0.5 min-h-[60px] rounded-xl border-2 transition-colors active:scale-95',
                  isSelected ? `${colors.bg} ${colors.border}` : 'bg-gray-50 border-transparent'
                )}
              >
                <span className={clsx('text-2xl leading-none', !isSelected && 'opacity-60')} aria-hidden="true">
                  {CATEGORY_ICONS[category]}
                </span>
                <span className={clsx('text-xs font-semibold', isSelected ? 'text-gray-900' : 'text-gray-500')}>
                  {CATEGORY_LABELS_SHORT[category]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section aria-labelledby="workout-heading" className="rounded-2xl bg-gray-50 p-4 space-y-4">
        <h2 id="workout-heading" className="text-base font-semibold text-gray-900">Combien ?</h2>
        <StepperField label="Séries" value={formData.workoutSeries} onChange={(workoutSeries) => update({ workoutSeries })} start={1} max={20} />
        <StepperField label="Répétitions" value={formData.workoutRepeat} onChange={(workoutRepeat) => update({ workoutRepeat })} start={10} />
        <DurationPicker value={formData.workoutDuration} onChange={(workoutDuration) => update({ workoutDuration })} />
      </section>

      <div>
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
          className="w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 text-left"
        >
          <span>
            <span className="block text-base font-medium text-gray-700">
              {detailsOpen ? 'Masquer les détails' : '+ Ajouter des détails'}
            </span>
            {!detailsOpen && (
              <span className="block text-sm text-gray-400">Consignes, conseil, parties du corps, matériel, photo</span>
            )}
          </span>
          <ChevronIcon direction={detailsOpen ? 'up' : 'down'} className="w-4 h-4 text-gray-400 shrink-0" />
        </button>

        {detailsOpen && (
          <div className="mt-4 space-y-6">
            <Textarea
              speech
              label="Consignes"
              rows={3}
              placeholder="Comment faire l'exercice, étape par étape"
              value={formData.descriptionText}
              onValueChange={(descriptionText) => update({ descriptionText })}
            />
            <Input
              speech
              label="Conseil"
              placeholder="Ex : garder le dos droit"
              value={formData.descriptionComment}
              onValueChange={(descriptionComment) => update({ descriptionComment })}
            />
            <ExerciceFormBodyparts
              category={formData.category}
              selectedBodyparts={formData.bodyparts}
              onToggleBodypart={toggleBodypart}
            />
            <ExerciceFormEquipments
              selectedEquipments={formData.equipments}
              allEquipments={allEquipments}
              equipmentIconsMap={equipmentIconsMap}
              loadingEquipments={loadingEquipments}
              onToggleEquipment={toggleEquipment}
              onAddEquipment={addNewEquipment}
            />
            <MediaUploader
              value={formData.media?.photos || []}
              onChange={(photos) =>
                update({ media: photos.length > 0 ? { video: formData.media?.video, photos } : null })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
