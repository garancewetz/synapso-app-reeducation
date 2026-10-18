import { prisma } from '@/app/lib/prisma';
import type { MediaItem } from '@/app/types/exercice';
import { getOwnedExerciceIds } from './getOwnedExerciceIds';

type CreateJournalNoteData = {
  title: string;
  description?: string;
  media?: MediaItem[];
  exerciceIds?: number[];
  userId: number;
};

export async function createJournalNote(data: CreateJournalNoteData) {
  const exerciceIds = await getOwnedExerciceIds(data.userId, data.exerciceIds ?? []);

  const note = await prisma.journalNote.create({
    data: {
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      media: data.media && data.media.length > 0 ? data.media : undefined,
      userId: data.userId,
      exercices: exerciceIds.length > 0
        ? {
            create: exerciceIds.map((exerciceId) => ({
              exerciceId,
            })),
          }
        : undefined,
    },
    include: {
      exercices: {
        include: {
          exercice: {
            select: { id: true, name: true, category: true },
          },
        },
      },
    },
  });

  return {
    ...note,
    exercices: note.exercices.map((je) => ({
      id: je.exercice.id,
      name: je.exercice.name,
      category: je.exercice.category,
    })),
  };
}
