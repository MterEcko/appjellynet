import { PrismaClient, Plan, AccountType, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@serviciosqbit.net' },
    update: {},
    create: {
      email: 'admin@serviciosqbit.net',
      passwordHash: adminPasswordHash,
      plan: Plan.PREMIUM,
      accountType: AccountType.MONTHLY,
      status: AccountStatus.ACTIVE,
      isAdmin: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create default profile for admin
  const adminProfile = await prisma.profile.upsert({
    where: {
      userId_name: {
        userId: admin.id,
        name: 'Administrador',
      },
    },
    update: {},
    create: {
      userId: admin.id,
      name: 'Administrador',
      isKidsProfile: false,
      jellyfinUserId: '', // Will be set when first used
    },
  });

  console.log('✅ Admin profile created:', adminProfile.name);

  // Create Jellyfin servers
  // Configuración específica para tu red
  const servers = [
    {
      serverId: 'local',
      name: 'Red Interna',
      url: 'http://10.10.0.112:8096',
      networkCidr: '10.10.0.0/24',
      priority: 1,
      protocol: 'http',
      isFallback: false,
    },
    {
      serverId: 'wisp',
      name: 'Red WISP (Clientes)',
      url: 'http://172.16.0.4:8096',
      networkCidr: '172.16.0.0/16',
      priority: 2,
      protocol: 'http',
      isFallback: false,
    },
    {
      serverId: 'isp',
      name: 'Red ISP',
      url: 'http://179.120.0.15:8096',
      networkCidr: '179.120.0.0/24',
      priority: 3,
      protocol: 'http',
      isFallback: false,
    },
    {
      serverId: 'isp-public',
      name: 'IP Pública ISP (Puerto 8081)',
      url: 'http://189.168.20.1:8081',
      networkCidr: '189.168.20.0/24',
      priority: 4,
      protocol: 'http',
      isFallback: false,
    },
    {
      serverId: 'public',
      name: 'Dominio Público HTTPS',
      url: 'https://qbitstream.serviciosqbit.net',
      networkCidr: null,
      priority: 5,
      protocol: 'https',
      isFallback: true,
    },
  ];

  for (const serverData of servers) {
    await prisma.server.upsert({
      where: { serverId: serverData.serverId },
      update: {},
      create: serverData,
    });
    console.log(`✅ Server created: ${serverData.name}`);
  }

  // Create demo user
  const demoPasswordHash = await bcrypt.hash('demo123', 10);
  const demoExpiresAt = new Date();
  demoExpiresAt.setDate(demoExpiresAt.getDate() + 7); // 7 days from now

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: demoPasswordHash,
      plan: Plan.DEMO,
      accountType: AccountType.DEMO,
      status: AccountStatus.ACTIVE,
      demoDurationDays: 7,
      demoExpiresAt: demoExpiresAt,
    },
  });

  console.log('✅ Demo user created:', demoUser.email);

  // Create default profile for demo user
  const demoProfile = await prisma.profile.upsert({
    where: {
      userId_name: {
        userId: demoUser.id,
        name: 'Demo',
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      name: 'Demo',
      isKidsProfile: false,
      jellyfinUserId: '', // Will be set when first used
    },
  });

  console.log('✅ Demo profile created:', demoProfile.name);

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
