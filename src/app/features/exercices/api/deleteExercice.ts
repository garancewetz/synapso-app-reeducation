import { prisma } from '@/app/lib/prisma';
import { deleteExerciceMedia } from '@/app/utils/cloudinary.utils';

type DeleteExerciceParams = {
  exerciceId: number;
  userId: number;
};

export async function deleteExercice(params: DeleteExerciceParams) {
  const { exerciceId, userId } = params;

  const existingExercice = await prisma.exercice.findFirst({
    where: {
      id: exerciceId,
      userId: userId,
    },
  });

  if (!existingExercice) {
    throw new Error('Exercice non trouvé');
  }

  if (existingExercice.media) {
    try {
      await deleteExerciceMedia(existingExercice.media as { photos?: Array<{ url: string; publicId: string }>; video?: { url: string; publicId: string } | null }, userId);
    } catch (error) {
      console.error('Error deleting exercice media from Cloudinary', error);
    }
  }

  await prisma.exercice.delete({
    where: { id: exerciceId },
  });
}
