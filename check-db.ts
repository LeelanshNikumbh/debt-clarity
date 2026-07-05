import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const debts = await prisma.debt.findMany();
  console.log('DEBTS FROM DB:');
  console.log(JSON.stringify(debts, null, 2));
}

main().finally(() => prisma.$disconnect());
