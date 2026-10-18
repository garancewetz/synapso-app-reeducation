import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAdmin, setImpersonateCookie, clearImpersonateCookie, getCurrentUserId } from '@/app/lib/auth';
import { logError } from '@/app/lib/logger';

/**
 * POST /api/admin/impersonate
 * Permet à un admin de "voir comme" un autre utilisateur
 */
export async function POST(request: NextRequest) {
  // Vérifier que l'utilisateur est admin
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json(
        { error: 'userId est requis et doit être un nombre' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        resetFrequency: true,
        dominantHand: true,
        hasJournal: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Créer la réponse avec le cookie d'impersonation
    const response = NextResponse.json({
      success: true,
      impersonatedUser: targetUser,
    });

    return setImpersonateCookie(response, userId);
  } catch (error) {
    logError('Erreur lors de l\'impersonation', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'impersonation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/impersonate
 * Arrête l'impersonation et revient à son propre compte
 */
export async function DELETE(request: NextRequest) {
  // Vérifier que l'utilisateur est admin
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const currentUserId = await getCurrentUserId(request);
    
    // Récupérer les infos de l'utilisateur admin
    const adminUser = await prisma.user.findUnique({
      where: { id: currentUserId! },
      select: {
        id: true,
        name: true,
        role: true,
        resetFrequency: true,
        dominantHand: true,
        hasJournal: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: adminUser,
    });

    return clearImpersonateCookie(response);
  } catch (error) {
    logError('Erreur lors de l\'arrêt de l\'impersonation', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'arrêt de l\'impersonation' },
      { status: 500 }
    );
  }
}

