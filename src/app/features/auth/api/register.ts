import { timingSafeEqual } from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { hashPassword } from '@/app/lib/auth';
import { createSessionToken } from '@/app/lib/auth-shared';

function getValidInvitationCodes(): string[] {
  const INVITATION_CODE = process.env.INVITATION_CODE;
  if (!INVITATION_CODE) {
    return [];
  }
  return INVITATION_CODE.split(',').map(code => code.trim()).filter(code => code.length > 0);
}

function validateInvitationCode(provided: string | undefined): boolean {
  const validCodes = getValidInvitationCodes();

  if (validCodes.length === 0) {
    return process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev';
  }

  if (!provided || typeof provided !== 'string') {
    return false;
  }

  const trimmedProvided = provided.trim();

  for (const validCode of validCodes) {
    if (trimmedProvided.length !== validCode.length) {
      continue;
    }

    const providedBuffer = Buffer.from(trimmedProvided, 'utf8');
    const expectedBuffer = Buffer.from(validCode, 'utf8');

    try {
      if (timingSafeEqual(providedBuffer, expectedBuffer)) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

type RegisterParams = {
  name: string;
  password: string;
  invitationCode: string;
  resetFrequency?: 'DAILY' | 'WEEKLY';
  dominantHand?: 'LEFT' | 'RIGHT';
  hasJournal?: boolean;
};

export async function register(params: RegisterParams) {
  const { name, password, invitationCode, resetFrequency, dominantHand, hasJournal } = params;

  if (!validateInvitationCode(invitationCode)) {
    throw new Error('Code d\'invitation invalide');
  }

  const trimmedName = name.trim();

  if (trimmedName.includes(' ')) {
    throw new Error('Le nom ne peut pas contenir d\'espaces');
  }

  const existingUser = await prisma.user.findUnique({
    where: { name: trimmedName },
  });

  if (existingUser) {
    throw new Error('Ce nom est déjà utilisé. Choisissez un autre nom.');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: trimmedName,
      passwordHash,
      ...(resetFrequency && { resetFrequency }),
      ...(dominantHand && { dominantHand }),
      ...(hasJournal !== undefined && { hasJournal }),
    },
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

  return {
    user,
    sessionToken: createSessionToken(user.id, passwordHash),
  };
}
