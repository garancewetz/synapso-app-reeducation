import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import type { MediaItem } from '@/app/types/exercice';
import { deleteCloudinaryMedia } from '@/app/utils/cloudinary.utils';
import { getOwnedExerciceIds } from './getOwnedExerciceIds';

type UpdateJournalNoteData = {
  title?: string;
  description?: string;
  media?: MediaItem[];
  exerciceIds?: number[];
};

type UpdateJournalNoteParams = {
  noteId: number;
  userId: number;
  data: UpdateJournalNoteData;
};

export async function updateJournalNote(params: UpdateJournalNoteParams) {
  const { noteId, userId, data } = params;

  const existingNote = await prisma.journalNote.findFirst({
    where: {
      id: noteId,
      userId: userId,
    },
  });

  if (!existingNote) {
    throw new Error('Note de journal non trouvée');
  }

  // Supprimer de Cloudinary les images retirées
  if (data.media !== undefined) {
    const oldMedia = (existingNote.media as MediaItem[] | null) || [];
    const newPublicIds = new Set(data.media.map((m) => m.publicId));
    const removedMedia = oldMedia.filter((m) => !newPublicIds.has(m.publicId));

    await Promise.all(
      removedMedia.map((m) => deleteCloudinaryMedia(m.publicId, userId, 'image'))
    );
  }

  // Mettre à jour les liens exercices : supprimer les anciens + recréer
  if (data.exerciceIds !== undefined) {
    const exerciceIds = await getOwnedExerciceIds(userId, data.exerciceIds);

    await prisma.journalNoteExercice.deleteMany({
      where: { journalNoteId: noteId },
    });

    if (exerciceIds.length > 0) {
      await prisma.journalNoteExercice.createMany({
        data: exerciceIds.map((exerciceId) => ({
          journalNoteId: noteId,
          exerciceId,
        })),
      });
    }
  }

  const note = await prisma.journalNote.update({
    where: { id: noteId },
    data: {
      title: data.title !== undefined ? data.title.trim() : undefined,
      description: data.description !== undefined ? data.description.trim() : undefined,
      media: data.media !== undefined ? (data.media.length > 0 ? data.media : Prisma.JsonNull) : undefined,
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
