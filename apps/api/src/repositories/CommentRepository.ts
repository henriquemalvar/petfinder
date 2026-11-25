import { Prisma, PrismaClient } from '@prisma/client';
import { PUBLIC_AUTHOR_SELECT } from '../constants/prismaSelect';
import { prisma } from '../config/prisma';

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { user: { select: typeof PUBLIC_AUTHOR_SELECT } };
}>;

export class CommentRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findByPostId(postId: string): Promise<CommentWithAuthor[]> {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: PUBLIC_AUTHOR_SELECT
        }
      }
    });
  }

  async create(postId: string, userId: string, text: string): Promise<CommentWithAuthor> {
    return this.prisma.comment.create({
      data: { postId, userId, text },
      include: {
        user: {
          select: PUBLIC_AUTHOR_SELECT
        }
      }
    });
  }
}
