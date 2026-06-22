const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fixing empty email fields in database...");
  const res = await prisma.project.updateMany({
    where: {
      email: ''
    },
    data: {
      email: null
    }
  });
  console.log(`Successfully updated ${res.count} projects setting email to null.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
