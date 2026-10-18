import { prisma } from '@/app/lib/prisma';
import { ExerciceCategory } from '@/app/types/exercice';
import { ExerciceCategory as PrismaExerciceCategory } from '@prisma/client';
import { getStartOfPeriod, isCompletedToday } from '@/app/utils/resetFrequency.utils';
import { addDays, startOfDay } from 'date-fns';
import { deletePhoto } from '@/app/utils/cloudinary.utils';

type UpdateExerciceData = {
  name?: string;
  descriptionText?: string;
  descriptionComment?: string | null;
  workoutRepeat?: string | null;
  workoutSeries?: string | null;
  workoutDuration?: string | null;
  equipments?: string[];
  category?: ExerciceCategory;
  bodyparts?: string[];
  media?: unknown;
  archived?: boolean;
};

type UpdateExerciceParams = {
  exerciceId: number;
  userId: number;
  data: UpdateExerciceData;
  resetFrequency: 'DAILY' | 'WEEKLY';
};

export async function updateExercice(params: UpdateExerciceParams) {
  const { exerciceId, userId, data, resetFrequency } = params;

  const existingExercice = await prisma.exercice.findFirst({
    where: {
      id: exerciceId,
      userId: userId,
    },
  });

  if (!existingExercice) {
    throw new Error('Exercice non trouvé');
  }

  const oldMedia = existingExercice.media as { photos?: Array<{ url: string; publicId: string }>; video?: { url: string; publicId: string } | null } | null;

  const now = new Date();
  const startOfPeriod = getStartOfPeriod(resetFrequency, now);
  const endOfPeriod = resetFrequency === 'DAILY'
    ? startOfDay(addDays(now, 1))
    : startOfDay(addDays(startOfPeriod, 7));

  const exercice = await prisma.$transaction(async (tx) => {
    const updated = await tx.exercice.update({
      where: { id: exerciceId },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        descriptionText: data.descriptionText !== undefined ? (data.descriptionText || '') : undefined,
        descriptionComment: data.descriptionComment !== undefined ? (data.descriptionComment || null) : undefined,
        workoutRepeat: data.workoutRepeat,
        workoutSeries: data.workoutSeries,
        workoutDuration: data.workoutDuration,
        equipments: data.equipments ? JSON.stringify(data.equipments) : undefined,
        category: data.category as PrismaExerciceCategory | undefined,
        ...(data.media !== undefined && data.media !== null && { media: data.media }),
        archived: data.archived !== undefined ? data.archived : undefined,
        archivedAt: data.archived !== undefined ? (data.archived ? new Date() : null) : undefined,
      },
    });

    if (data.bodyparts && Array.isArray(data.bodyparts)) {
      await tx.exerciceBodypart.deleteMany({
        where: { exerciceId: exerciceId },
      });

      await Promise.all(data.bodyparts.map(async (bodypartName: string) => {
        const bodypart = await tx.bodypart.upsert({
          where: { name: bodypartName },
          update: {},
          create: { name: bodypartName },
        });
        
        await tx.exerciceBodypart.create({
          data: {
            exerciceId: exerciceId,
            bodypartId: bodypart.id,
          },
        });
      }));
    }

    return updated;
  });

  if (oldMedia) {
    const newMedia = data.media as { photos?: Array<{ url: string; publicId: string }>; video?: { url: string; publicId: string } | null } | null | undefined;
    
    try {
      if (oldMedia.photos && Array.isArray(oldMedia.photos)) {
        const newPhotoPublicIds = newMedia?.photos?.map(p => p.publicId) || [];
        const photosToDelete = oldMedia.photos.filter(photo => !newPhotoPublicIds.includes(photo.publicId));
        
        for (const photo of photosToDelete) {
          await deletePhoto(photo, userId);
        }
      }
    } catch (error) {
      // Log l'erreur mais continuer
      console.error('Error cleaning up old exercice media from Cloudinary', error);
    }
  }

  const history = await prisma.history.findMany({
    where: {
      exerciceId: exerciceId,
      completedAt: {
        gte: startOfPeriod,
        lt: endOfPeriod,
      },
    },
    orderBy: {
      completedAt: 'asc',
    },
  });

  let equipmentsParsed: string[] = [];
  try {
    equipmentsParsed = JSON.parse(exercice.equipments || '[]');
  } catch {
    equipmentsParsed = [];
  }

  const exerciceBodyparts = await prisma.exerciceBodypart.findMany({
    where: { exerciceId: exerciceId },
    include: {
      bodypart: true,
    },
  });

  const weeklyCompletions = history.map(h => h.completedAt);
  const completedInPeriod = weeklyCompletions.length > 0;
  const completedDate = exercice.completedAt ? new Date(exercice.completedAt) : null;
  const completedToday = isCompletedToday(completedDate);

  return {
    id: exercice.id,
    name: exercice.name,
    description: {
      text: exercice.descriptionText,
      comment: exercice.descriptionComment,
    },
    workout: {
      repeat: exercice.workoutRepeat,
      series: exercice.workoutSeries,
      duration: exercice.workoutDuration,
    },
    equipments: equipmentsParsed,
    bodyparts: data.bodyparts || exerciceBodyparts.map(eb => eb.bodypart.name),
    category: exercice.category as ExerciceCategory,
    completed: completedInPeriod,
    completedToday: completedToday,
    completedAt: exercice.completedAt,
    pinned: exercice.pinned,
    weeklyCompletions: weeklyCompletions,
    media: exercice.media ?? null,
    archived: exercice.archived ?? false,
    archivedAt: exercice.archivedAt,
  };
}
