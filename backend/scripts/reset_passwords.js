const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('Dainna@2022', 10);
  const agentHash = await bcrypt.hash('Dainna@2022', 10);
  const advHash = await bcrypt.hash('Dainna@2022', 10);
  const staffHash = await bcrypt.hash('Dainna@2022', 10);

  const updates = [
    { username: 'admin', hash: adminHash },
    { username: 'agent', hash: agentHash },
    { username: 'adv', hash: advHash },
    { username: 'staff', hash: staffHash }
  ];

  for (const item of updates) {
    const res = await prisma.user.updateMany({
      where: { username: item.username },
      data: {
        password: item.hash,
        wrongPwdCount: 0,
        status: 1
      }
    });
    console.log(`Updated ${item.username}: ${res.count} rows`);
  }
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
