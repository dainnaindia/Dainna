const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Assigning Pending Agent Codes ---');

  // 1. Get the max existing userCode for agents (userTypeId: 3)
  const maxAgent = await prisma.user.findFirst({
    where: {
      userTypeId: 3,
      userCode: { not: null }
    },
    orderBy: {
      userCode: 'desc'
    }
  });

  let nextSeq = 1;
  if (maxAgent && typeof maxAgent.userCode === 'number') {
    nextSeq = maxAgent.userCode + 1;
  }
  console.log(`Starting sequence from: ${nextSeq}`);

  // 2. Fetch all states for prefix mapping
  const states = await prisma.state_master.findMany();
  const stateMap = new Map();
  states.forEach(s => {
    if (s.state_name) {
      stateMap.set(s.state_id, s.state_name.trim().substring(0, 3).toUpperCase());
    }
  });

  // 3. Find pending agents (where userTypeId is 3 and userCodeFull is null or empty)
  const pendingAgents = await prisma.user.findMany({
    where: {
      userTypeId: 3,
      OR: [
        { userCodeFull: null },
        { userCodeFull: '' },
        { userCodeFull: 'Pending' }
      ]
    },
    orderBy: {
      userId: 'asc' // Process in order of registration
    }
  });

  console.log(`Found ${pendingAgents.length} pending agents to update.\n`);

  for (const agent of pendingAgents) {
    const stateId = agent.stateId;
    let statePrefix = 'SYS';
    if (stateId && stateMap.has(stateId)) {
      statePrefix = stateMap.get(stateId);
    }

    const workingCity = agent.workingCity || '';
    const cityPrefix = workingCity ? workingCity.trim().substring(0, 3).toUpperCase() : 'WCT';

    const userCodeVal = nextSeq++;
    const digitStr = String(userCodeVal).padStart(4, '0');
    const userCodeFullVal = `${statePrefix}/${cityPrefix}/${digitStr}`;

    console.log(`Updating user ID ${agent.userId} (${agent.firstname} ${agent.surname}):`);
    console.log(`  State ID: ${stateId} -> Prefix: ${statePrefix}`);
    console.log(`  Working City: "${workingCity}" -> Prefix: ${cityPrefix}`);
    console.log(`  Assigned userCode: ${userCodeVal}`);
    console.log(`  Assigned userCodeFull: ${userCodeFullVal}`);

    await prisma.user.update({
      where: { userId: agent.userId },
      data: {
        userCode: userCodeVal,
        userCodeFull: userCodeFullVal
      }
    });

    console.log(`  [SUCCESS]\n`);
  }

  console.log('--- Finished Updating Agent Codes ---');
}

main().catch(err => {
  console.error('Error during execution:', err);
}).finally(() => {
  prisma.$disconnect();
});
