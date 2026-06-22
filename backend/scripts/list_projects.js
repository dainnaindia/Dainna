const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: {
      projectId: true,
      projectName: true,
      state_id: true,
      city: true,
      email: true,
      advocate_id: true
    }
  });
  console.log(JSON.stringify(projects, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
