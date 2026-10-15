'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePeriodProgress } from '../hooks/usePeriodProgress';
import { useCelebration } from '@/app/hooks/useCelebration';
import { useConfetti } from '@/app/contexts/ConfettiContext';

const ConfettiRain = dynamic(
  () => import('./ConfettiRain').then(mod => ({ default: mod.ConfettiRain })),
  { ssr: false, loading: () => null }
);

const CELEBRATION_EMOJIS = ['🎉', '🎊', '⭐', '💪', '🌟', '✨', '🏆', '💫'];
const CONFETTI_COLORS = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#ef4444', '#06b6d4'];

export function GlobalCelebration() {
  const periodProgress = usePeriodProgress();
  const { showCelebration, animationKey } = useCelebration(periodProgress);
  const { startGlobalCelebration, endGlobalCelebration } = useConfetti();

  useEffect(() => {
    if (showCelebration) {
      startGlobalCelebration();
    } else {
      endGlobalCelebration();
    }
  }, [showCelebration, startGlobalCelebration, endGlobalCelebration]);

  return (
    <ConfettiRain
      key={animationKey}
      show={showCelebration}
      fromWindow={true}
      emojiCount={7}
      confettiCount={40}
      emojis={CELEBRATION_EMOJIS}
      colors={CONFETTI_COLORS}
    />
  );
}
