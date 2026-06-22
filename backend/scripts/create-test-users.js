const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: 'admin', password: 'admin', userTypeId: 1, firstname: 'Test', surname: 'Admin', status: 1 },
    { username: 'staff', password: 'staff', userTypeId: 2, firstname: 'Test', surname: 'Staff', status: 1 },
    { username: 'agent', password: 'agent', userTypeId: 3, firstname: 'Test', surname: 'Agent', status: 1 },
    { username: 'adv', password: 'adv', userTypeId: 4, firstname: 'Test', surname: 'Advocate', status: 1 },
    { username: 'test_admin', password: 'admin123', userTypeId: 1, firstname: 'Test', surname: 'Admin', status: 1 },
    { username: 'test_staff', password: 'staff123', userTypeId: 2, firstname: 'Test', surname: 'Staff', status: 1 },
    { username: 'test_agent', password: 'agent123', userTypeId: 3, firstname: 'Test', surname: 'Agent', status: 1 },
    { username: 'test_adv', password: 'adv123', userTypeId: 4, firstname: 'Test', surname: 'Advocate', status: 1 }
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const existing = await prisma.user.findUnique({
      where: { username: u.username }
    });

    if (existing) {
      await prisma.user.update({
        where: { username: u.username },
        data: { password: hashedPassword, userTypeId: u.userTypeId, status: 1 }
      });
      console.log(`Updated user ${u.username}`);
    } else {
      await prisma.user.create({
        data: {
          username: u.username,
          password: hashedPassword,
          userTypeId: u.userTypeId,
          firstname: u.firstname,
          surname: u.surname,
          status: 1
        }
      });
      console.log(`Created user ${u.username}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
