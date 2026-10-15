'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Exercice, ExerciceCategory, ExerciceStatusFilter } from '@/app/types/exercice';
import {
  BODYPART_TO_CATEGORY,
  BODYPART_ICONS,
  AVAILABLE_BODYPARTS,
} from '@/app/constants/exercice.constants';
import { getEquipmentIcon } from '@/app/constants/equipment.constants';
import { getRelatedStretching } from '../utils/stretching.utils';

type BodypartWithCount = { value: string; label: string; icon: string; count: number };
type EquipmentWithCount = { value: string; label: string; icon: string; count: number };

type UseCategoryFiltersOptions = {
  exercices: Exercice[];
  stretchingExercices: Exercice[];
  baseFilteredExercices: Exercice[];
  categoryParam: ExerciceCategory;
  filter: ExerciceStatusFilter;
};

type UseCategoryFiltersReturn = {
  selectedBodyparts: string[];
  setSelectedBodyparts: React.Dispatch<React.SetStateAction<string[]>>;
  selectedEquipments: string[];
  setSelectedEquipments: React.Dispatch<React.SetStateAction<string[]>>;
  bodypartsWithCounts: BodypartWithCount[];
  equipmentsWithCounts: EquipmentWithCount[];
  filteredExercices: Exercice[];
  relatedStretchingExercices: Exercice[];
  totalStretchingCount: number;
  isAllBodypartsSelected: boolean;
  isAllEquipmentsSelected: boolean;
  handleSelectAllBodyparts: () => void;
  handleSelectAllEquipments: () => void;
  handleResetAllFilters: () => void;
};

export function useCategoryFilters({
  exercices,
  stretchingExercices,
  baseFilteredExercices,
  categoryParam,
  filter,
}: UseCategoryFiltersOptions): UseCategoryFiltersReturn {
  const [selectedBodyparts, setSelectedBodyparts] = useState<string[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);

  const bodypartsWithCounts = useMemo(() => {
    const isStretching = categoryParam === 'STRETCHING';
    const categoryBodyparts = isStretching
      ? AVAILABLE_BODYPARTS
      : AVAILABLE_BODYPARTS.filter(bp => BODYPART_TO_CATEGORY[bp] === categoryParam);

    const counts: Record<string, number> = {};
    exercices.forEach(ex => {
      ex.bodyparts.forEach(bp => {
        if (isStretching || BODYPART_TO_CATEGORY[bp] === categoryParam) {
          counts[bp] = (counts[bp] || 0) + 1;
        }
      });
    });

    if (!isStretching && stretchingExercices.length > 0) {
      stretchingExercices.forEach(ex => {
        ex.bodyparts.forEach(bp => {
          if (categoryBodyparts.includes(bp as (typeof AVAILABLE_BODYPARTS)[number])) {
            counts[bp] = (counts[bp] || 0) + 1;
          }
        });
      });
    }

    const bodypartsToShow = categoryBodyparts.filter(bp => counts[bp] > 0);
    return bodypartsToShow
      .map(bp => ({
        value: bp,
        label: bp,
        icon: BODYPART_ICONS[bp] || '',
        count: counts[bp],
      }))
      .sort((a, b) => b.count - a.count);
  }, [exercices, stretchingExercices, categoryParam]);

  const equipmentsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    exercices.forEach(ex => {
      ex.equipments?.forEach(eq => {
        counts[eq] = (counts[eq] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([value, count]) => ({
        value,
        label: value,
        icon: getEquipmentIcon(value),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [exercices]);

  const filteredExercices = useMemo(() => {
    let result = baseFilteredExercices;
    if (selectedBodyparts.length > 0) {
      result = result.filter(e =>
        e.bodyparts.some(bp => selectedBodyparts.includes(bp))
      );
    }
    if (selectedEquipments.length > 0) {
      result = result.filter(e =>
        e.equipments?.some(eq => selectedEquipments.includes(eq))
      );
    }
    return result;
  }, [baseFilteredExercices, selectedBodyparts, selectedEquipments]);

  const relatedStretchingExercices = useMemo(() => {
    let filtered = getRelatedStretching(stretchingExercices, categoryParam);
    if (filter === 'notCompleted') {
      filtered = filtered.filter(e => !e.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(e => e.completed);
    }
    if (selectedBodyparts.length > 0) {
      filtered = filtered.filter(ex =>
        ex.bodyparts.some(bp => selectedBodyparts.includes(bp))
      );
    }
    if (selectedEquipments.length > 0) {
      filtered = filtered.filter(ex =>
        ex.equipments?.some(eq => selectedEquipments.includes(eq))
      );
    }
    return filtered;
  }, [
    categoryParam,
    stretchingExercices,
    selectedBodyparts,
    selectedEquipments,
    filter,
  ]);

  const totalStretchingCount = useMemo(() => {
    if (categoryParam === 'STRETCHING' || !stretchingExercices.length) {
      return 0;
    }
    const categoryBodyparts = AVAILABLE_BODYPARTS.filter(
      bp => BODYPART_TO_CATEGORY[bp] === categoryParam
    );
    let filtered = stretchingExercices.filter(ex =>
      ex.bodyparts.some(bp =>
        categoryBodyparts.includes(bp as (typeof AVAILABLE_BODYPARTS)[number])
      )
    );
    if (selectedBodyparts.length > 0) {
      filtered = filtered.filter(ex =>
        ex.bodyparts.some(bp => selectedBodyparts.includes(bp))
      );
    }
    if (selectedEquipments.length > 0) {
      filtered = filtered.filter(ex =>
        ex.equipments?.some(eq => selectedEquipments.includes(eq))
      );
    }
    return filtered.length;
  }, [categoryParam, stretchingExercices, selectedBodyparts, selectedEquipments]);

  const isAllBodypartsSelected = selectedBodyparts.length === 0;
  const isAllEquipmentsSelected = selectedEquipments.length === 0;

  const handleSelectAllBodyparts = useCallback(() => {
    setSelectedBodyparts([]);
  }, []);

  const handleSelectAllEquipments = useCallback(() => {
    setSelectedEquipments([]);
  }, []);

  const handleResetAllFilters = useCallback(() => {
    setSelectedBodyparts([]);
    setSelectedEquipments([]);
  }, []);

  return {
    selectedBodyparts,
    setSelectedBodyparts,
    selectedEquipments,
    setSelectedEquipments,
    bodypartsWithCounts,
    equipmentsWithCounts,
    filteredExercices,
    relatedStretchingExercices,
    totalStretchingCount,
    isAllBodypartsSelected,
    isAllEquipmentsSelected,
    handleSelectAllBodyparts,
    handleSelectAllEquipments,
    handleResetAllFilters,
  };
}
