import { PostStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from '../src/config/prisma';
import { requireEnv } from '../src/config/env';
import { coordsFor, postCopy, postTypeFor, SEED_PETS } from './seedData';

type SeedUser = {
  name: string;
  email: string;
  password: string;
  whatsapp?: string;
  instagram: string;
  contactPreference: 'WHATSAPP' | 'INSTAGRAM';
};

const LOCAL_USERS: SeedUser[] = [
  { name: 'João Silva', email: 'joao@email.com', password: '123456', whatsapp: '11999999999', instagram: '@joaosilva', contactPreference: 'WHATSAPP' },
  { name: 'Maria Santos', email: 'maria@email.com', password: '123456', whatsapp: '11988888888', instagram: '@mariasantos', contactPreference: 'INSTAGRAM' },
  { name: 'Pedro Oliveira', email: 'pedro@email.com', password: '123456', whatsapp: '11977777777', instagram: '@pedrooliveira', contactPreference: 'WHATSAPP' },
  { name: 'Ana Costa', email: 'ana@email.com', password: '123456', whatsapp: '11966666666', instagram: '@anacosta', contactPreference: 'INSTAGRAM' },
  { name: 'Lucas Mendes', email: 'lucas@email.com', password: '123456', whatsapp: '11955555555', instagram: '@lucasmendes', contactPreference: 'WHATSAPP' },
];

const isProductionSeed = process.env.SEED_MODE === 'production';

function productionUsers(): SeedUser[] {
  const demoEmail = requireEnv('DEMO_USER_EMAIL');
  const demoPassword = requireEnv('DEMO_USER_PASSWORD');
  return LOCAL_USERS.map((user, index) => {
    const isDemo = index === 0;
    const handle = user.email.split('@')[0];
    return {
      name: isDemo ? 'Visitante Demo' : user.name,
      email: isDemo ? demoEmail : `${handle}@petfinder.example`,
      password: isDemo ? demoPassword : randomBytes(24).toString('base64url'),
      instagram: `@petfinder.demo.${handle}`,
      contactPreference: 'INSTAGRAM',
    };
  });
}

function petOwnerIndex(petIndex: number, userCount: number): number {
  if (!isProductionSeed) return Math.floor(petIndex / 4);
  return 1 + (petIndex % (userCount - 1));
}

async function prepareDatabase(): Promise<void> {
  if (isProductionSeed) {
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      throw new Error(`Seed de produção recusado: o banco já tem ${existingUsers} usuários.`);
    }
    return;
  }
  await prisma.notification.deleteMany();
  await prisma.post.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await prepareDatabase();

  const seedUsers = isProductionSeed ? productionUsers() : LOCAL_USERS;
  const users = await Promise.all(
    seedUsers.map(async ({ password, ...user }) =>
      prisma.user.create({ data: { ...user, password: await bcrypt.hash(password, 10) } }),
    ),
  );

  // Criar pets
  const pets = await Promise.all(
    SEED_PETS.map(({ neighborhood, ...petData }, index) => {
      const { latitude, longitude } = coordsFor(neighborhood, index);
      return prisma.pet.create({
        data: {
          ...petData,
          location: `${neighborhood}, Belo Horizonte`,
          latitude,
          longitude,
          userId: users[petOwnerIndex(index, users.length)].id,
        },
      });
    })
  );

  // Criar posts
  const posts = await Promise.all(
    pets.map((pet, index) => {
      const postType = postTypeFor(index);
      const { title, content } = postCopy(pet, postType);

      return prisma.post.create({
        data: {
          title,
          content,
          type: postType,
          status: PostStatus.ACTIVE,
          petId: pet.id,
          userId: pet.userId,
        },
      });
    })
  );

  // Criar algumas notificações de exemplo
  const notifications = await Promise.all(
    posts.slice(0, 5).map((post) =>
      prisma.notification.create({
        data: {
          message: `Novo interesse em ${post.title}`,
          userId: post.userId,
          postId: post.id,
        },
      })
    )
  );

  console.log('Seed concluído com sucesso!');
  console.log(`Criados ${users.length} usuários`);
  console.log(`Criados ${pets.length} pets`);
  console.log(`Criados ${posts.length} posts`);
  console.log(`Criados ${notifications.length} notificações`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 