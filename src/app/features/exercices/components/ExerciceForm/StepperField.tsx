'use client';

import { MinusIcon, PlusIcon } from '@/app/components/ui/icons';

type Props = {
  label: string;
  /** Stored as free text in the database ("3"); empty = not set. */
  value: string;
  onChange: (value: string) => void;
  /** Value set by the first "+" when empty. */
  start: number;
  max?: number;
};

/** Steps of 1 up to 10, then 5 by 5 — 10 → 15 → 20 repetitions in two taps. */
const nextUp = (n: number) => (n < 10 ? n + 1 : n + 5);
const nextDown = (n: number) => (n <= 10 ? n - 1 : n - 5);

/**
 * − value + : one thumb, no keyboard (the number stays editable for odd values).
 * Going below 1 clears the field.
 */
export function StepperField({ label, value, onChange, start, max = 200 }: Props) {
  const current = parseInt(value, 10);
  const hasValue = Number.isFinite(current) && current > 0;

  const increment = () => onChange(String(hasValue ? Math.min(max, nextUp(current)) : start));
  const decrement = () => {
    if (!hasValue) return;
    const next = nextDown(current);
    onChange(next >= 1 ? String(next) : '');
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-base font-medium text-gray-800">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={!hasValue}
          aria-label={`${label} : moins`}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-700 disabled:opacity-40 active:scale-95"
        >
          <MinusIcon className="w-5 h-5" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={hasValue ? String(current) : ''}
          placeholder="—"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
          aria-label={label}
          className="w-14 h-12 rounded-xl border border-gray-200 text-center text-xl font-semibold tabular-nums text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <button
          type="button"
          onClick={increment}
          aria-label={`${label} : plus`}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
