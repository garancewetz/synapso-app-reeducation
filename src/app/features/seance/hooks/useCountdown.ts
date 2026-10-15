'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type UseCountdownReturn = {
  remaining: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (seconds?: number) => void;
};

/**
 * Countdown driven by an absolute end timestamp (not by counting ticks), so it
 * stays exact when the phone throttles timers or the tab goes to background.
 */
export function useCountdown(initialSeconds: number, onEnd: () => void): UseCountdownReturn {
  const [total, setTotal] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [endAt, setEndAt] = useState<number | null>(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setEndAt(null);
        onEndRef.current();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endAt]);

  const start = useCallback(() => {
    // Restart from the full duration once a countdown has reached zero.
    const from = remaining > 0 ? remaining : total;
    setRemaining(from);
    setEndAt(Date.now() + from * 1000);
  }, [remaining, total]);

  const pause = useCallback(() => setEndAt(null), []);

  const reset = useCallback((seconds?: number) => {
    const next = seconds ?? total;
    setEndAt(null);
    setTotal(next);
    setRemaining(next);
  }, [total]);

  return { remaining, isRunning: endAt !== null, start, pause, reset };
}
