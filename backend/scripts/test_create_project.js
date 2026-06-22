const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Testing project creation...");
  try {
    const testProject = await prisma.project.create({
      data: {
        projectName: 'Test Auto Project ' + Date.now(),
        state_id: 1, // Goa or default state id
        city: 'Test City',
        addeddate: new Date()
      }
    });
    console.log("Project created successfully!", testProject);
    
    // Clean up
    await prisma.project.delete({
      where: { projectId: testProject.projectId }
    });
    console.log("Cleaned up test project successfully.");
  } catch (err) {
    console.error("Failed to create project:", err);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
