const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const historyRows = await prisma.adv_payment_history_master.findMany({
      take: 10,
      orderBy: { adv_pay_history_id: 'desc' }
    });
    console.log('History rows:', JSON.stringify(historyRows, null, 2));

    const masterRows = await prisma.adv_payment_master.findMany({
      take: 10,
      orderBy: { adv_pay_id: 'desc' }
    });
    console.log('Master rows:', JSON.stringify(masterRows, null, 2));
  } catch (err) {
    console.error('Error listing tables:', err);
  }
}

main().finally(() => {
  prisma.$disconnect();
});
