import { prisma } from '@/app/lib/prisma';

/**
 * Ne garde que les exercices appartenant à l'utilisateur.
 * 🔒 Sans ce filtre, lier une note à l'ID d'un exercice d'un autre compte
 * renverrait son nom et sa catégorie.
 */
export async function getOwnedExerciceIds(userId: number, exerciceIds: number[]): Promise<number[]> {
  if (exerciceIds.length === 0) return [];

  const owned = await prisma.exercice.findMany({
    where: { id: { in: exerciceIds }, userId },
    select: { id: true },
  });
  return owned.map((exercice) => exercice.id);
}
