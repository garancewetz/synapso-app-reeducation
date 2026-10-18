import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/app/lib/auth';
import { parseNumericId } from '@/app/lib/api-route-utils';
import { logError } from '@/app/lib/logger';
import { getJournalNoteById, updateJournalNote, deleteJournalNote } from '@/app/features/journal/api';
import { deleteCloudinaryMedia } from '@/app/utils/cloudinary.utils';
import type { MediaItem } from '@/app/types/exercice';
import { validateBody, requireJsonContentType, updateJournalNoteSchema } from '@/app/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { id: idParam } = await params;
    const parsed = parseNumericId(idParam);
    if (parsed instanceof NextResponse) return parsed;
    const { id } = parsed;

    const note = await getJournalNoteById({ noteId: id, userId });

    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof Error && error.message === 'Note de journal non trouvée') {
      return NextResponse.json(
        { error: 'Note de journal non trouvée' },
        { status: 404 }
      );
    }
    logError('Erreur lors de la récupération de la note de journal', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la note de journal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const ctError = requireJsonContentType(request);
  if (ctError) return ctError;

  try {
    const { id: idParam } = await params;
    const parsed = parseNumericId(idParam);
    if (parsed instanceof NextResponse) return parsed;
    const { id } = parsed;

    const body = await request.json();
    const validated = validateBody(updateJournalNoteSchema, body);
    if (validated instanceof NextResponse) return validated;
    const { data } = validated;

    const note = await updateJournalNote({
      noteId: id,
      userId,
      data: {
        title: data.title,
        description: data.description,
        media: data.media,
        exerciceIds: data.exerciceIds,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof Error && error.message === 'Note de journal non trouvée') {
      return NextResponse.json(
        { error: 'Note de journal non trouvée' },
        { status: 404 }
      );
    }
    logError('Erreur lors de la mise à jour de la note de journal', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la note de journal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { id: idParam } = await params;
    const parsed = parseNumericId(idParam);
    if (parsed instanceof NextResponse) return parsed;
    const { id } = parsed;

    // Récupérer la note pour nettoyer les médias Cloudinary
    const note = await getJournalNoteById({ noteId: id, userId });
    const media = (note.media as MediaItem[] | null) || [];

    await deleteJournalNote({ noteId: id, userId });

    // Supprimer les images de Cloudinary après la suppression en BDD
    await Promise.all(
      media.map((m) => deleteCloudinaryMedia(m.publicId, userId, 'image'))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Note de journal non trouvée') {
      return NextResponse.json(
        { error: 'Note de journal non trouvée' },
        { status: 404 }
      );
    }
    logError('Erreur lors de la suppression de la note de journal', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la note de journal' },
      { status: 500 }
    );
  }
}
