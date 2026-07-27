import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/client.ts';

const connectionString = process.env.DATABASE_URL || 'postgresql://rooqx@localhost/kwasucourse_alloc?host=/var/run/postgresql';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const departments = [
    { name: 'Computer Science', code: 'CSC' },
    { name: 'Mass Communication', code: 'MAC' },
    { name: 'Library Science', code: 'LIS' },
    { name: 'Cybersecurity', code: 'CYS' },
  ];

  console.log('Seeding departments...');

  for (const dept of departments) {
    const upserted = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: {
        name: dept.name,
        code: dept.code,
      },
    });
    console.log(`Upserted department: ${upserted.name} (${upserted.code})`);
  }

  console.log('Finished seeding departments!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
