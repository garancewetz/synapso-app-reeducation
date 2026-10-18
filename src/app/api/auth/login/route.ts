import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/app/lib/auth';
import { logError } from '@/app/lib/logger';
import { login } from '@/app/features/auth/api';
import { rateLimit, rateLimitResponse } from '@/app/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom est obligatoire' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Le mot de passe est obligatoire' },
        { status: 400 }
      );
    }

    // Le middleware limite par IP ; ici on limite aussi par compte visé
    if (process.env.NODE_ENV !== 'development') {
      const nameLimit = await rateLimit('loginName', name.trim().toLowerCase());
      if (!nameLimit.allowed) {
        return rateLimitResponse('loginName', nameLimit, 'Trop de tentatives. Veuillez réessayer dans quelques minutes.');
      }
    }

    const { user, sessionToken } = await login({
      name,
      password,
    });

    const response = NextResponse.json({
      success: true,
      user,
    });

    return setAuthCookie(response, sessionToken);
  } catch (error) {
    if (error instanceof Error && error.message === 'Identifiants incorrects') {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }
    logError('Erreur lors de la connexion', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}
