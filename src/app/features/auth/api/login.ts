import { prisma } from '@/app/lib/prisma';
import { verifyPassword } from '@/app/lib/auth';
import { createSessionToken } from '@/app/lib/auth-shared';

// Hash bcrypt valide (coût 10) : comparer contre lui prend le même temps qu'un
// vrai compte, ce qui évite de deviner les noms existants au temps de réponse.
const DUMMY_PASSWORD_HASH = '$2b$10$C4Zt4rAa6PpXHuxclT6wyucQYBtDIX2DVAKUWxCdzrAcyR6WF9ysG';

type LoginParams = {
  name: string;
  password: string;
};

export async function login(params: LoginParams) {
  const { name, password } = params;

  const user = await prisma.user.findUnique({
    where: { name: name.trim() },
    select: {
      id: true,
      name: true,
      passwordHash: true,
      role: true,
      resetFrequency: true,
      dominantHand: true,
      hasJournal: true,
      createdAt: true,
    },
  });

  let isValidPassword = false;
  
  if (user) {
    isValidPassword = await verifyPassword(password, user.passwordHash);
  } else {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
  }

  if (!user || !isValidPassword) {
    throw new Error('Identifiants incorrects');
  }

  const { passwordHash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    sessionToken: createSessionToken(user.id, passwordHash),
  };
}
