'use client';

import { useCallback, useEffect, useRef } from 'react';

type WakeLockSentinelLike = { release: () => Promise<void> };
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
};

/**
 * Keeps the screen on during a session (the phone sits nearby while exercising)
 * and plays the end-of-timer signal. Both degrade silently when unsupported.
 */
export function useSessionSignals() {
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const nav = navigator as NavigatorWithWakeLock;
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (!nav.wakeLock || document.visibilityState !== 'visible') return;
      try {
        const lock = await nav.wakeLock.request('screen');
        if (cancelled) void lock.release();
        else sentinel = lock;
      } catch {
        // Denied (low battery, unsupported context): the session still works.
      }
    };

    // The lock is dropped whenever the page is hidden — take it back on return.
    const onVisibility = () => { if (document.visibilityState === 'visible') void acquire(); };
    void acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => {});
    };
  }, []);

  useEffect(() => () => { void audioRef.current?.close().catch(() => {}); }, []);

  // iOS only lets audio play once unlocked by a user gesture: call this from
  // the "Démarrer" tap so the end beep can sound later.
  const unlockAudio = useCallback(() => {
    try {
      if (!audioRef.current) {
        const Ctor = window.AudioContext
          ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        audioRef.current = new Ctor();
      }
      void audioRef.current.resume();
    } catch {
      // No audio available: vibration and the visual state remain.
    }
  }, []);

  const signalEnd = useCallback(() => {
    navigator.vibrate?.([200, 100, 200, 100, 400]);
    const ctx = audioRef.current;
    if (!ctx) return;
    // Three short beeps, the last one longer.
    [0, 0.35, 0.7].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startAt = ctx.currentTime + offset;
      const length = i === 2 ? 0.5 : 0.2;
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + length);
    });
  }, []);

  return { unlockAudio, signalEnd };
}
