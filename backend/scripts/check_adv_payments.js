const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 5; // Advocate id
  const status = 1; // Success

  const whereClause = {
    payment_status: status,
    invoice_master: {
      some: { advocate_id: userId }
    }
  };

  const payments = await prisma.adv_payment_master.findMany({
    where: whereClause,
    include: {
      invoice_master: {
        include: {
          project_master: true,
          olb_master: true
        }
      }
    }
  });

  console.log('Payments found for Advocate 5:', JSON.stringify(payments, null, 2));
}

main().finally(() => {
  prisma.$disconnect();
});
