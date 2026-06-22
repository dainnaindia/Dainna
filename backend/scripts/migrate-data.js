const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  const rootDir = __dirname;
  const mainSchemaPath = path.resolve(rootDir, '..', '..', 'database', 'schema.prisma');
  const tempSchemaPath = path.resolve(rootDir, '..', '..', 'database', 'schema-mysql.prisma');

  console.log('--- Database Migration Tool: MariaDB to PostgreSQL ---');

  // 1. Check main schema.prisma existence
  if (!fs.existsSync(mainSchemaPath)) {
    console.error(`Main schema file not found at ${mainSchemaPath}`);
    process.exit(1);
  }

  // 2. Generate temporary MariaDB Schema file
  console.log('Generating temporary MariaDB schema...');
  let schemaContent = fs.readFileSync(mainSchemaPath, 'utf8');

  // Replace provider to mysql
  schemaContent = schemaContent.replace(/provider = "postgresql"/, 'provider = "mysql"');
  // Replace DATABASE_URL with MariaDB URL
  schemaContent = schemaContent.replace(/url\s+=\s+env\("DATABASE_URL"\)/, 'url = "mysql://root@127.0.0.1:3308/xenonerp_dainna"');
  // Add custom client generator output path
  schemaContent = schemaContent.replace(
    /generator client \{([\s\S]*?)\}/,
    `generator client {
  provider = "prisma-client-js"
  output   = "../backend/scripts/prisma/generated-mysql"
}`
  );

  fs.writeFileSync(tempSchemaPath, schemaContent, 'utf8');

  // 3. Generate MariaDB Client
  console.log('Generating temporary MariaDB Prisma Client...');
  try {
    const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    execSync(`${cmd} prisma generate --schema=../../database/schema-mysql.prisma`, { stdio: 'inherit', cwd: rootDir });
  } catch (err) {
    console.error('Failed to generate MariaDB client:', err);
    cleanup(tempSchemaPath);
    process.exit(1);
  }

  // 4. Instantiate Clients
  console.log('Connecting to databases...');
  const { PrismaClient: PrismaMysql } = require('./prisma/generated-mysql');
  const { PrismaClient: PrismaPostgres } = require('@prisma/client');
  const { Pool } = require('pg');
  const { PrismaPg } = require('@prisma/adapter-pg');

  const mysql = new PrismaMysql();
  let pgPool;
  let pg;

  try {
    await mysql.$connect();
    console.log('[OK] Connected to MariaDB (Source)');
  } catch (err) {
    console.error('[Error] Can\'t connect to MariaDB on port 3308. Make sure it is running.');
    cleanup(tempSchemaPath);
    process.exit(1);
  }

  try {
    const connectionString = process.env.DATABASE_URL;
    pgPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
        servername: 'ep-muddy-wind-at711r6g.c-9.us-east-1.aws.neon.tech'
      }
    });
    const adapter = new PrismaPg(pgPool);
    pg = new PrismaPostgres({ adapter });
    await pg.$connect();
    console.log('[OK] Connected to PostgreSQL (Target)');
  } catch (err) {
    console.error('[Error] Can\'t connect to PostgreSQL:', err);
    cleanup(tempSchemaPath);
    await mysql.$disconnect();
    if (pgClient) await pgClient.end();
    process.exit(1);
  }

  // List of tables to migrate (Prisma model names)
  const models = [
    { name: 'UserType', dbName: 'user_type_master' },
    { name: 'security_que_master', dbName: 'security_que_master' },
    { name: 'state_master', dbName: 'state_master' },
    { name: 'User', dbName: 'user_master' },
    { name: 'Project', dbName: 'project_master' },
    { name: 'Olb', dbName: 'olb_master' },
    { name: 'Chat', dbName: 'chat_master' },
    { name: 'adv_payment_master', dbName: 'adv_payment_master' },
    { name: 'Notification', dbName: 'notification_master' },
    { name: 'adv_payment_history_master', dbName: 'adv_payment_history_master' },
    { name: 'company_master', dbName: 'company_master' },
    { name: 'handling_charges', dbName: 'handling_charges' },
    { name: 'payment_gateway_master', dbName: 'payment_gateway_master' },
    { name: 'invoice_master', dbName: 'invoice_master' },
    { name: 'invoice_payment_master', dbName: 'invoice_payment_master' },
    { name: 'login_history', dbName: 'login_history' },
    { name: 'olb_item_master', dbName: 'olb_item_master' },
    { name: 'transaction_history', dbName: 'transaction_history' }
  ];

  try {
    // Clear target tables in reverse dependency order (child tables first) to prevent foreign key errors
    console.log('Clearing existing target PostgreSQL tables in reverse dependency order...');
    for (const model of models.slice().reverse()) {
      const prismaModelPg = pg[model.name.charAt(0).toLowerCase() + model.name.slice(1)];
      if (prismaModelPg) {
        console.log(`- Clearing table "${model.dbName}"...`);
        await prismaModelPg.deleteMany();
      }
    }

    // Migrate data in forward dependency order (parent tables first)
    console.log('Migrating local data to PostgreSQL in dependency order...');
    for (const model of models) {
      const prismaModelMysql = mysql[model.name.charAt(0).toLowerCase() + model.name.slice(1)];
      const prismaModelPg = pg[model.name.charAt(0).toLowerCase() + model.name.slice(1)];

      if (!prismaModelMysql || !prismaModelPg) {
        console.warn(`[Warn] Skipping model ${model.name} (Prisma API name mismatch)`);
        continue;
      }

      console.log(`Migrating table "${model.dbName}"...`);
      let rows = await prismaModelMysql.findMany();
      console.log(`- Found ${rows.length} rows in source.`);

      if (rows.length > 0) {
        // Break circular dependency with User for state_master
        if (model.name === 'state_master') {
          rows = rows.map(r => ({
            ...r,
            addedby: null,
            modifiedby: null
          }));
        }

        // Batch insert records
        const chunkSize = 200;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          await prismaModelPg.createMany({ data: chunk });
        }
        console.log(`- Successfully inserted ${rows.length} rows.`);
      }
    }
    console.log('*** Migration completed successfully! ***');
  } catch (err) {
    console.error('[Error] Migration failed:', err);
  } finally {
    await mysql.$disconnect();
    if (pg) await pg.$disconnect();
    if (pgPool) await pgPool.end().catch(() => {});
    cleanup(tempSchemaPath);
  }
}

function cleanup(tempSchemaPath) {
  console.log('Cleaning up temporary files...');
  if (fs.existsSync(tempSchemaPath)) {
    fs.unlinkSync(tempSchemaPath);
  }
  // Try to remove temporary client directory if generated
  const tempClientDir = path.join(__dirname, 'prisma', 'generated-mysql');
  if (fs.existsSync(tempClientDir)) {
    try {
      fs.rmSync(tempClientDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  }
}

main();
