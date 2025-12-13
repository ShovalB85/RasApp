import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default misgeret with admin user
  const misgeret = await prisma.misgeret.upsert({
    where: { id: 'misgeret-1' },
    update: {},
    create: {
      id: 'misgeret-1',
      name: 'מטה כללי',
      personnel: {
        create: {
          id: 'admin-1',
          name: 'שובל ברמלי',
          personalId: '8223283',
          passwordHash: await bcrypt.hash('P)O(I*q1w2e3', 10),
          role: 'admin',
        },
      },
    },
    include: {
      personnel: true,
    },
  });

  console.log('✅ Seeded misgeret:', misgeret.name);
  console.log('✅ Seeded admin user:', misgeret.personnel[0].name);
  console.log('   Personal ID: 8223283');
  console.log('   Password: P)O(I*q1w2e3');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


