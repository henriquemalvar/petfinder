import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../../config/prisma';

const TABLES = ['Notification', 'Comment', 'Post', 'Pet', 'User'];

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
