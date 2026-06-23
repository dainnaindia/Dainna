const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'dainna-secret-super-key-2.0';

async function testInsert() {
  console.log('Running Open Land Record Insertion test...');
  
  const prisma = new PrismaClient();
  let agent;
  try {
    agent = await prisma.user.findFirst({
      where: { userTypeId: 3, status: 1 } // Active Agent
    });
  } catch (err) {
    console.error('Error connecting to database via Prisma client:', err.message);
    process.exit(1);
  }
  
  if (!agent) {
    console.error('No active agent user found in database to authenticate.');
    await prisma.$disconnect();
    process.exit(1);
  }
  
  console.log(`Authenticating as agent: ${agent.username} (ID: ${agent.userId})`);
  const token = jwt.sign(
    { userId: agent.userId, username: agent.username, userTypeId: agent.userTypeId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  await prisma.$disconnect();

  // Create a unique city survey number to avoid conflicts and verify unique inserts
  const uniqueSurveyNo = `CSN-TEST-${Date.now()}`;

  const postData = JSON.stringify({
    Area: "1",
    StateID: "1", // Gujarat or other state
    District: "Rajkot",
    PlotArea: "1500 sq ft",
    CitySurveyOffice: "Office Test",
    Ward: "Ward Test",
    CitySurveyNo: uniqueSurveyNo,
    SheetNo: "99",
    OwnerFirstName: "AutoTestOwnerFirst",
    OwnerMiddleName: "AutoTestOwnerMiddle",
    OwnerLastName: "AutoTestOwnerLast",
    OwnerMobile: "9876543210",
    PurchaserFirstName: "AutoTestPurchaserFirst",
    PurchaserMiddleName: "AutoTestPurchaserMiddle",
    PurchaserLastName: "AutoTestPurchaserLast",
    PurchaserMobile: "9998887776",
    PurchaserEmail: "test-purchaser@example.com"
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/properties/add-ol',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log(`Response Status: ${res.statusCode}`);
      console.log(`Response Body: ${body}`);
      try {
        const json = JSON.parse(body);
        if (res.statusCode === 200 && json.Status === 2) {
          console.log('\n==================================================');
          console.log('SUCCESS: Open Land record inserted successfully!');
          console.log(`New Property ID (OLBID): ${json.OLBID}`);
          console.log('==================================================');
          process.exit(0);
        } else {
          console.error('\n==================================================');
          console.error('FAILURE: Unexpected response status or body.');
          console.error('==================================================');
          process.exit(1);
        }
      } catch (err) {
        console.error('FAILURE: Failed to parse response body as JSON.', err);
        process.exit(1);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    console.error('Make sure the backend server is running on port 5000.');
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

testInsert().catch(err => {
  console.error('Unexpected error in test script:', err);
  process.exit(1);
});
