import { describe, expect, it } from 'vitest';
import { getRelatedStretching } from '@/app/features/exercices/utils/stretching.utils';
import type { Exercice } from '@/app/types';

const make = (id: number, category: Exercice['category'], bodyparts: string[], extra: Partial<Exercice> = {}): Exercice => ({
  id, name: `ex${id}`, description: { text: '', comment: null },
  workout: { repeat: null, series: null, duration: null }, equipments: [], bodyparts,
  category, completed: false, completedToday: false, completedAt: null, pinned: false, ...extra,
});

describe('getRelatedStretching', () => {
  const all = [
    make(1, 'CORE', ['Dos']),
    make(2, 'STRETCHING', ['Dos']),          // targets the trunk
    make(3, 'STRETCHING', ['Jambes']),       // other zone
    make(4, 'STRETCHING', ['Ventre'], { archived: true }),
  ];

  it('keeps active stretches targeting a body part of the zone', () => {
    expect(getRelatedStretching(all, 'CORE').map((e) => e.id)).toEqual([2]);
  });

  it('returns nothing for the stretching zone itself', () => {
    expect(getRelatedStretching(all, 'STRETCHING')).toEqual([]);
  });
});
