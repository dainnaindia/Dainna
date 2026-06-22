const bcrypt = require('bcryptjs');

async function run() {
  console.log('test_admin (admin123):', await bcrypt.compare('admin123', '$2a$10$2z0p/rYbdwS1Xw6BmCOSoe1F.MbSXB8YMzy0KOhWWH3H8LUPQw8BO'));
  console.log('test_agent (agent123):', await bcrypt.compare('agent123', '$2a$10$.a85ssSha69ND07SBVXfSucQZ7NHb0m8WtpRK2.HaRDgBVaPfMZlS'));
  console.log('test_adv (adv123):', await bcrypt.compare('adv123', '$2a$10$/y.c07wVngjbkFQ2.ToxVufathM4bfg.hu94BAVyhvlEv/bpGvj.a'));
}
run();
