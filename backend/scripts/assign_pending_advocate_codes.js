const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getCleanPrefix(str) {
  if (!str) return '';
  const name = str.trim().toLowerCase();
  
  // Transliteration checks for known Gujarati and special names
  if (name.includes('ગોકુલ') || name.includes('gokul')) return 'GOK';
  if (name.includes('ગોકુ') || name.includes('gokoli')) return 'GOK';
  if (name.includes('સુરત') || name.includes('surat')) return 'SUR';
  if (name.includes('આશ્રમ') || name.includes('ashram')) return 'ASH';
  if (name.includes('અમદાવાદ') || name.includes('ahmedabad') || name.includes('અમદ')) return 'AHM';
  if (name.includes('બરોડા') || name.includes('baroda')) return 'BAR';
  if (name.includes('રાજકોટ') || name.includes('rajkot')) return 'RAJ';
  if (name.includes('નાસિક') || name.includes('nashik')) return 'NAS';
  if (name.includes('વેલી') || name.includes('veli')) return 'VEL';
  if (name.includes('સીટી') || name.includes('city')) return 'CIT';
  if (name.includes('ગાંઘી') || name.includes('gandhi')) return 'GAN';
  if (name.includes('આશ્ર') || name.includes('ashr')) return 'ASH';

  // Fallback: strip non-alphanumeric and take first 3 chars
  const englishOnly = str.replace(/[^a-zA-Z0-9]/g, '');
  if (englishOnly.length >= 3) {
    return englishOnly.substring(0, 3).toUpperCase();
  }
  
  return str.substring(0, 3).toUpperCase();
}

async function main() {
  console.log('--- Assigning Pending Advocate Codes ---');

  // 1. Get the max existing userCode for advocates (userTypeId: 4)
  const maxAdvocate = await prisma.user.findFirst({
    where: {
      userTypeId: 4,
      userCode: { not: null }
    },
    orderBy: {
      userCode: 'desc'
    }
  });

  let nextSeq = 1;
  if (maxAdvocate && typeof maxAdvocate.userCode === 'number') {
    nextSeq = maxAdvocate.userCode + 1;
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

  // 3. Fetch all projects to map links
  const projects = await prisma.project.findMany();
  const projectMap = new Map();
  projects.forEach(p => {
    if (p.advocate_id) {
      projectMap.set(p.advocate_id, p);
    }
  });

  // 4. Find pending advocates (where userTypeId is 4 and userCodeFull is null or empty)
  const pendingAdvocates = await prisma.user.findMany({
    where: {
      userTypeId: 4,
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

  console.log(`Found ${pendingAdvocates.length} pending advocates to update.\n`);

  for (const adv of pendingAdvocates) {
    const stateId = adv.stateId;
    let statePrefix = 'SYS';
    if (stateId && stateMap.has(stateId)) {
      statePrefix = stateMap.get(stateId);
    }

    // Determine city
    const linkedProject = projectMap.get(adv.userId);
    let workingCity = adv.workingCity || '';
    if (!workingCity && linkedProject && linkedProject.city) {
      workingCity = linkedProject.city;
    }
    const cityPrefix = workingCity ? getCleanPrefix(workingCity) : 'WCT';

    // Determine project prefix
    let projectPrefix = '';
    if (linkedProject && linkedProject.projectName) {
      projectPrefix = getCleanPrefix(linkedProject.projectName);
    }

    const userCodeVal = nextSeq++;
    const digitStr = String(userCodeVal).padStart(4, '0');
    
    // Construct userCodeFull based on whether project is present
    const userCodeFullVal = projectPrefix
      ? `${statePrefix}/${cityPrefix}/${projectPrefix}/${digitStr}`
      : `${statePrefix}/${cityPrefix}/${digitStr}`;

    console.log(`Updating user ID ${adv.userId} (${adv.firstname} ${adv.surname}):`);
    console.log(`  State ID: ${stateId} -> Prefix: ${statePrefix}`);
    console.log(`  Working City: "${workingCity}" -> Prefix: ${cityPrefix}`);
    if (projectPrefix) {
      console.log(`  Project: "${linkedProject.projectName}" -> Prefix: ${projectPrefix}`);
    }
    console.log(`  Assigned userCode: ${userCodeVal}`);
    console.log(`  Assigned userCodeFull: ${userCodeFullVal}`);

    await prisma.user.update({
      where: { userId: adv.userId },
      data: {
        userCode: userCodeVal,
        userCodeFull: userCodeFullVal
      }
    });

    console.log(`  [SUCCESS]\n`);
  }

  console.log('--- Finished Updating Advocate Codes ---');
}

main().catch(err => {
  console.error('Error during execution:', err);
}).finally(() => {
  prisma.$disconnect();
});
