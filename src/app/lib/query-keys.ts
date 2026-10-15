import type { ExerciceCategory } from '@/app/types/exercice';

export const queryKeys = {
  exercices: {
    all: ['exercices'] as const,
    lists: () => [...queryKeys.exercices.all, 'list'] as const,
    list: (filters: {
      category?: ExerciceCategory;
      equipments?: string[];
      includeArchived?: boolean;
      targetDate?: string;
      resetFrequency?: 'DAILY' | 'WEEKLY';
    }) => [...queryKeys.exercices.lists(), filters] as const,
  },
  history: {
    all: ['history'] as const,
    lists: () => [...queryKeys.history.all, 'list'] as const,
    list: (params: { since?: string; days?: number; referenceDate?: string }) =>
      [...queryKeys.history.lists(), params] as const,
  },
  progress: {
    all: ['progress'] as const,
    lists: () => [...queryKeys.progress.all, 'list'] as const,
    list: (params: { limit?: number }) =>
      [...queryKeys.progress.lists(), params] as const,
  },
  categoryStats: {
    all: ['categoryStats'] as const,
    lists: () => [...queryKeys.categoryStats.all, 'list'] as const,
    list: (params: { userId: number; resetFrequency: 'DAILY' | 'WEEKLY'; referenceDateKey: string }) =>
      [...queryKeys.categoryStats.lists(), params] as const,
    aggregated: (params: { targetDate?: string }) =>
      [...queryKeys.categoryStats.all, 'aggregated', params] as const,
  },
  equipments: {
    all: ['equipments'] as const,
  },
  equipmentMetadata: {
    all: ['equipmentMetadata'] as const,
  },
  journalNotes: {
    all: ['journalNotes'] as const,
    lists: () => [...queryKeys.journalNotes.all, 'list'] as const,
    list: () => [...queryKeys.journalNotes.lists()] as const,
  },
  journalProgress: {
    all: ['journalProgress'] as const,
    lists: () => [...queryKeys.journalProgress.all, 'list'] as const,
    list: (userId: number) => [...queryKeys.journalProgress.lists(), userId] as const,
  },
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
  },
  shares: {
    all: ['shares'] as const,
    received: () => [...queryKeys.shares.all, 'received'] as const,
    count: () => [...queryKeys.shares.all, 'count'] as const,
    users: () => [...queryKeys.shares.all, 'users'] as const,
  },
} as const;
