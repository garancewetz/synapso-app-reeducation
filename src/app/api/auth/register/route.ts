import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/app/lib/auth';
import { logError } from '@/app/lib/logger';
import { register } from '@/app/features/auth/api';
import { validateBody, requireJsonContentType, registerSchema } from '@/app/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const ctError = requireJsonContentType(request);
    if (ctError) return ctError;

    const body = await request.json();
    const result = validateBody(registerSchema, body);
    if (result instanceof NextResponse) return result;
    const { data } = result;

    const { user, sessionToken } = await register({
      name: data.name,
      password: data.password,
      invitationCode: data.invitationCode,
      resetFrequency: data.resetFrequency,
      dominantHand: data.dominantHand,
      hasJournal: data.hasJournal,
    });

    const response = NextResponse.json({
      success: true,
      user,
    }, { status: 201 });

    return setAuthCookie(response, sessionToken);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Code d\'invitation invalide') {
        return NextResponse.json(
          { error: 'Code d\'invitation invalide' },
          { status: 403 }
        );
      }
      if (error.message.includes('déjà utilisé') || error.message.includes('déjà pris')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    logError('Erreur lors de la création du compte', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}

