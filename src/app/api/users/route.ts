import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/lib/auth';
import { logError } from '@/app/lib/logger';
import { getUsers } from '@/app/features/auth/api';

/**
 * GET /api/users
 * Liste tous les utilisateurs - ADMIN ONLY
 * Pour les utilisateurs normaux, utiliser /api/auth/check
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    logError('Error fetching users', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST est supprimé - la création de compte passe maintenant par /api/auth/register
