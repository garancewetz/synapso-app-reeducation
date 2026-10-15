import { useState, useEffect, useRef } from 'react';
import type { PeriodProgress } from '@/app/features/exercices/hooks/usePeriodProgress';

const CELEBRATION_DURATION_MS = 4800;

type UseCelebrationReturn = {
  showCelebration: boolean;
  animationKey: number;
};

/**
 * Celebration when the last exercise of the period (day or week) gets done:
 * fires only on the transition "not all done" → "all done", never at load.
 */
export function useCelebration(progress: PeriodProgress | null): UseCelebrationReturn {
  const [showCelebration, setShowCelebration] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const isComplete = progress !== null && progress.total > 0 && progress.done >= progress.total;
  const prevCompleteRef = useRef<boolean | null>(progress === null ? null : isComplete);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup uniquement au unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Ignorer le chargement initial
    if (progress === null) return;

    const wasComplete = prevCompleteRef.current;
    prevCompleteRef.current = isComplete;

    if (wasComplete === false && isComplete) {
      // Annuler le timer précédent si re-trigger pendant l'animation
      if (timerRef.current) clearTimeout(timerRef.current);

      setAnimationKey(prev => prev + 1);
      setShowCelebration(true);

      timerRef.current = setTimeout(() => {
        setShowCelebration(false);
        timerRef.current = null;
      }, CELEBRATION_DURATION_MS);
    }
  }, [progress, isComplete]);

  return { showCelebration, animationKey };
}
