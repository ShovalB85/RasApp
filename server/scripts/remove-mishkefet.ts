import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeMishkefet() {
  try {
    console.log('Searching for משקפת items...');
    
    // Find all inventory items with name "משקפת"
    const items = await prisma.inventoryItem.findMany({
      where: {
        name: {
          contains: 'משקפת',
        }
      },
      include: {
        taasuka: true
      }
    });

    if (items.length === 0) {
      console.log('No משקפת items found.');
      return;
    }

    console.log(`Found ${items.length} משקפת item(s):`);
    items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (ID: ${item.id}) in Taasuka: ${item.taasuka.name}`);
    });

    // Delete all משקפת items
    const deleteResult = await prisma.inventoryItem.deleteMany({
      where: {
        name: {
          contains: 'משקפת',
        }
      }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.count} משקפת item(s).`);
  } catch (error) {
    console.error('Error removing משקפת items:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeMishkefet();

