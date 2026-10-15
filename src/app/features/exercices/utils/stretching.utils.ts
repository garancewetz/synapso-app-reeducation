import type { Exercice, ExerciceCategory } from '@/app/types/exercice';
import { AVAILABLE_BODYPARTS, BODYPART_TO_CATEGORY } from '@/app/constants/exercice.constants';

/**
 * Stretches related to a body zone: active stretching exercises targeting at
 * least one body part of that zone. Shared by the zone page ("Étirements
 * conseillés") and the zone session, so both always propose the same ones.
 */
export function getRelatedStretching(exercices: Exercice[], category: ExerciceCategory): Exercice[] {
  if (category === 'STRETCHING') return [];
  const zoneBodyparts = new Set<string>(
    AVAILABLE_BODYPARTS.filter((bodypart) => BODYPART_TO_CATEGORY[bodypart] === category)
  );
  return exercices.filter(
    (exercice) =>
      exercice.category === 'STRETCHING' &&
      !exercice.archived &&
      exercice.bodyparts.some((bodypart) => zoneBodyparts.has(bodypart))
  );
}
