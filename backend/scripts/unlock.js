const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { wrongPwdCount: { gte: 5 } },
        { status: 0, username: 'admin' }
      ]
    },
    data: {
      wrongPwdCount: 0,
      status: 1
    }
  });
  console.log(`Unlocked/reset ${result.count} accounts.`);
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
