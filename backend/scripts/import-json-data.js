const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration
const JSON_DATA_DIR = 'C:\\Users\\INTEL\\Downloads\\dainna_database_data\\database\\data';
const SCHEMA_PRISMA_PATH = path.resolve(__dirname, '..', '..', 'database', 'schema.prisma');

// Simple parser for schema.prisma to identify model fields and types
function parseSchema(schemaPath) {
  console.log(`Parsing schema at: ${schemaPath}`);
  const content = fs.readFileSync(schemaPath, 'utf8');
  const models = {};
  let currentModel = null;

  const lines = content.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('model ')) {
      currentModel = line.split(/\s+/)[1];
      models[currentModel] = { fields: {}, map: currentModel };
    } else if (line.startsWith('@@map(')) {
      const match = line.match(/@@map\("([^"]+)"\)/);
      if (match && currentModel) {
        models[currentModel].map = match[1];
      }
    } else if (currentModel && line.startsWith('}')) {
      currentModel = null;
    } else if (currentModel && line && !line.startsWith('@@') && !line.startsWith('//')) {
      const parts = line.split(/\s+/);
      const fieldName = parts[0];
      const fieldType = parts[1];
      if (fieldName && fieldType) {
        models[currentModel].fields[fieldName] = fieldType;
      }
    }
  }
  return models;
}

function cleanRow(row, fieldTypes) {
  const cleaned = {};
  for (const [key, val] of Object.entries(row)) {
    const type = fieldTypes[key];
    if (!type) {
      continue; // Skip relation or non-schema fields
    }

    // Only include scalar types in database inserts.
    const baseType = type.replace('?', '');
    const isScalar = ['Int', 'Float', 'Decimal', 'String', 'Boolean', 'DateTime', 'Bytes', 'Json', 'BigInt'].includes(baseType);
    if (!isScalar) {
      continue;
    }

    if (val === null || val === undefined) {
      cleaned[key] = null;
      continue;
    }

    if (type.startsWith('Int')) {
      if (val === '') {
        cleaned[key] = null;
      } else {
        cleaned[key] = parseInt(val, 10);
      }
    } else if (type.startsWith('Float') || type.startsWith('Decimal')) {
      if (val === '') {
        cleaned[key] = null;
      } else {
        cleaned[key] = parseFloat(val);
      }
    } else if (type.startsWith('DateTime')) {
      if (val === '') {
        cleaned[key] = null;
      } else {
        cleaned[key] = new Date(val);
      }
    } else if (type.startsWith('Boolean')) {
      if (val === '') {
        cleaned[key] = false;
      } else {
        cleaned[key] = Boolean(val);
      }
    } else {
      // String or VarChar
      cleaned[key] = val;
    }
  }
  return cleaned;
}

async function main() {
  console.log('--- JSON Data Importer for PostgreSQL ---');

  if (!fs.existsSync(JSON_DATA_DIR)) {
    console.error(`Error: JSON data directory not found at: ${JSON_DATA_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(SCHEMA_PRISMA_PATH)) {
    console.error(`Error: schema.prisma not found at: ${SCHEMA_PRISMA_PATH}`);
    process.exit(1);
  }

  const schemaModels = parseSchema(SCHEMA_PRISMA_PATH);
  
  // Read all JSON files
  const files = fs.readdirSync(JSON_DATA_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} JSON data files.`);

  // Connect to target PostgreSQL database
  try {
    await prisma.$connect();
    console.log('[OK] Connected to PostgreSQL.');
  } catch (err) {
    console.error('[Error] Connection failed:', err);
    process.exit(1);
  }

  try {
    // Disable constraints for safe import
    console.log('Temporarily disabling PostgreSQL constraint checks...');
    await prisma.$executeRawUnsafe("SET session_replication_role = 'replica';");

    for (const file of files) {
      const fileBasename = path.basename(file, '.json');
      // Find matching Prisma model (case-insensitive)
      const modelName = Object.keys(schemaModels).find(m => m.toLowerCase() === fileBasename.toLowerCase());

      if (!modelName) {
        console.warn(`[Warn] No matching Prisma model found for JSON file: ${file}. Skipping.`);
        continue;
      }

      const prismaClientProp = modelName.charAt(0).toLowerCase() + modelName.slice(1);
      const modelClient = prisma[prismaClientProp];

      if (!modelClient) {
        console.warn(`[Warn] Prisma Client has no property "${prismaClientProp}". Skipping.`);
        continue;
      }

      const filePath = path.join(JSON_DATA_DIR, file);
      const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`Importing "${modelName}" from ${file} (${rawData.length} rows)...`);

      if (rawData.length > 0) {
        // Clear target table
        await modelClient.deleteMany();

        // Clean rows to match types
        const cleanedRows = rawData.map(row => cleanRow(row, schemaModels[modelName].fields));

        // Insert in chunks of 200 to prevent payload limits
        const chunkSize = 200;
        for (let i = 0; i < cleanedRows.length; i += chunkSize) {
          const chunk = cleanedRows.slice(i, i + chunkSize);
          await modelClient.createMany({ data: chunk });
        }
        console.log(`- Successfully imported ${cleanedRows.length} rows.`);
      } else {
        console.log(`- Table empty in source.`);
      }
    }

    // Re-enable constraint checks
    console.log('Re-enabling PostgreSQL constraint checks...');
    await prisma.$executeRawUnsafe("SET session_replication_role = 'origin';");
    console.log('*** Migration from JSON completed successfully! ***');

  } catch (err) {
    console.error('[Error] Import failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
