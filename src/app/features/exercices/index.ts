// Components
export { ExerciceRow } from './components/ExerciceRow';
export { ExerciceForm } from './components/ExerciceForm';
export { ExerciceCardTags } from './components/ExerciceCardTags';
export { ExerciceMedia } from './components/ExerciceMedia';
export { CategoryCardWithProgress } from './components/CategoryCardWithProgress';
export { CategoryBodypartsSection } from './components/CategoryBodypartsSection';
export { CategoryAffinerSection } from './components/CategoryAffinerSection';
export { CategoryActiveFiltersBar } from './components/CategoryActiveFiltersBar';
export { PeriodProgressBar } from './components/PeriodProgressBar';

// ExerciceForm sub-components
export { ExerciceFormCategory } from './components/ExerciceForm/ExerciceFormCategory';
export { ExerciceFormBodyparts } from './components/ExerciceForm/ExerciceFormBodyparts';
export { ExerciceFormFields } from './components/ExerciceForm/ExerciceFormFields';
export { ExerciceFormWorkout } from './components/ExerciceForm/ExerciceFormWorkout';
export { ExerciceFormEquipments } from './components/ExerciceForm/ExerciceFormEquipments';

// Hooks
export { useExercices } from './hooks/useExercices';
export { useCompleteExercice } from './hooks/useCompleteExercice';
export { usePinExercice } from './hooks/usePinExercice';
export { useArchiveExercice } from './hooks/useArchiveExercice';
export { useExerciceStatusFilter } from './hooks/useExerciceStatusFilter';
export { useCategoryFilters } from './hooks/useCategoryFilters';
export { useCategoryStats } from './hooks/useCategoryStats';
export { usePeriodProgress } from './hooks/usePeriodProgress';
export { useExerciceHandlers } from './hooks/useExerciceHandlers';

// Utils
export * from './utils/exercice-complete.utils';

// Celebration components
export { GlobalCelebration } from './components/GlobalCelebration';
export { ConfettiRain } from './components/ConfettiRain';
export { ConfettiExplosion } from './components/ConfettiExplosion';
export { ConfettiValidate } from './components/ConfettiValidate';
