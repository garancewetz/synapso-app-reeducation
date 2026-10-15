'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { parseDurationSeconds } from '@/app/features/seance/utils/seance.utils';

/** Ready-made durations — always readable by the session timer. */
const PRESETS: { seconds: number; label: string }[] = [
  { seconds: 10, label: '10 secondes' },
  { seconds: 20, label: '20 secondes' },
  { seconds: 30, label: '30 secondes' },
  { seconds: 45, label: '45 secondes' },
  { seconds: 60, label: '1 min' },
  { seconds: 120, label: '2 min' },
];

const short = (seconds: number) => (seconds < 60 ? `${seconds} s` : `${seconds / 60} min`);

type Props = {
  /** Free text in the database ("30 secondes", "Le plus longtemps possible"); empty = none. */
  value: string;
  onChange: (value: string) => void;
};

export function DurationPicker({ value, onChange }: Props) {
  const seconds = parseDurationSeconds(value);
  const preset = PRESETS.find((p) => p.seconds === seconds);
  // Anything that isn't a preset ("Le plus longtemps possible", "90 s") stays editable as text.
  const [customOpen, setCustomOpen] = useState(Boolean(value.trim()) && !preset);

  const chip = (selected: boolean) =>
    clsx(
      'min-h-[44px] px-3.5 rounded-full text-base font-medium border transition-colors active:scale-95',
      selected ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
    );

  return (
    <div>
      <span className="block text-base font-medium text-gray-800 mb-2">Durée</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Durée">
        <button type="button" className={chip(!value.trim() && !customOpen)} aria-pressed={!value.trim() && !customOpen} onClick={() => { setCustomOpen(false); onChange(''); }}>
          Aucune
        </button>
        {PRESETS.map((p) => {
          const selected = !customOpen && preset?.seconds === p.seconds;
          return (
            <button key={p.seconds} type="button" className={chip(selected)} aria-pressed={selected} onClick={() => { setCustomOpen(false); onChange(p.label); }}>
              {short(p.seconds)}
            </button>
          );
        })}
        <button type="button" className={chip(customOpen)} aria-pressed={customOpen} onClick={() => setCustomOpen(true)}>
          Autre…
        </button>
      </div>
      {customOpen && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex : 90 secondes, le plus longtemps possible"
          aria-label="Autre durée"
          className="mt-3 w-full h-12 px-4 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      )}
    </div>
  );
}
