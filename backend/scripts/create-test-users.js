const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Seed User Types first (due to foreign key constraint)
  const userTypes = [
    { userTypeId: 1, userType: 'Admin' },
    { userTypeId: 2, userType: 'Staff' },
    { userTypeId: 3, userType: 'Agent' },
    { userTypeId: 4, userType: 'Advocate' }
  ];

  for (const ut of userTypes) {
    const existingUt = await prisma.userType.findFirst({
      where: { userTypeId: ut.userTypeId }
    });
    if (!existingUt) {
      await prisma.userType.create({
        data: ut
      });
      console.log(`Created user type ${ut.userType}`);
    }
  }

  // Delete other test users if they exist
  const testUsernames = ['staff', 'agent', 'adv', 'test_admin', 'test_staff', 'test_agent', 'test_adv'];
  await prisma.user.deleteMany({
    where: {
      username: { in: testUsernames }
    }
  });
  console.log('Cleaned up previous test users from database');

  const users = [
    { username: 'admin', password: 'admin', userTypeId: 1, firstname: 'Test', surname: 'Admin', status: 1 }
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
