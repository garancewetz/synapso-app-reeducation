/**
 * Change le rôle d'un utilisateur (ADMIN ou USER).
 * Remplace l'ancienne variable ADMIN_NAME : l'inscription ne donne plus jamais
 * le rôle ADMIN, qui se donne uniquement depuis ce script.
 *
 * Usage :
 *   npx tsx scripts/set-user-role.ts <nom> <ADMIN|USER>          (base de dev si DATABASE_URL_DEV est défini)
 *   npx tsx scripts/set-user-role.ts <nom> <ADMIN|USER> --prod   (base DATABASE_URL)
 */

import { config } from 'dotenv';
import { PrismaClient, UserRole } from '@prisma/client';

config();

const [name, role] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const useProd = process.argv.includes('--prod');

if (!name || (role !== UserRole.ADMIN && role !== UserRole.USER)) {
  console.error('Usage : npx tsx scripts/set-user-role.ts <nom> <ADMIN|USER> [--prod]');
  process.exit(1);
}

if (!useProd && process.env.DATABASE_URL_DEV) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_DEV;
}

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { name },
    data: { role: role as UserRole },
  });
  if (result.count === 0) {
    console.error(`Utilisateur "${name}" introuvable.`);
    process.exit(1);
  }
  console.log(`"${name}" a maintenant le rôle ${role} (${useProd ? 'prod' : 'dev'}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
