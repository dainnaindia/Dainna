const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = [
    { name: 'project_master', id: 'project_id' },
    { name: 'user_master', id: 'user_id' },
    { name: 'chat_master', id: 'chat_id' },
    { name: 'notification_master', id: 'notification_id' },
    { name: 'olb_master', id: 'olb_id' },
    { name: 'adv_payment_master', id: 'adv_pay_id' },
    { name: 'handling_charges', id: 'charge_id' },
    { name: 'invoice_master', id: 'invoice_id' },
    { name: 'invoice_payment_master', id: 'ip_id' },
    { name: 'state_master', id: 'state_id' }
  ];

  for (const table of tables) {
    try {
      console.log(`Resetting sequence for ${table.name}...`);
      // PostgreSQL query to reset sequence to max id + 1
      const query = `SELECT setval(pg_get_serial_sequence('"${table.name}"', '${table.id}'), COALESCE(MAX("${table.id}"), 0) + 1, false) FROM "${table.name}"`;
      await prisma.$queryRawUnsafe(query);
      console.log(`Successfully reset sequence for ${table.name}`);
    } catch (err) {
      console.error(`Error resetting sequence for ${table.name}:`, err.message);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
