import { prisma } from '../config/prisma';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/AppError';

export class CommentService {
  async findByPostId(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new AppError('Post não encontrado', StatusCodes.NOT_FOUND);
    }

    return prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  }

  async create(postId: string, userId: string, text: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new AppError('Post não encontrado', StatusCodes.NOT_FOUND);
    }

    return prisma.comment.create({
      data: { postId, userId, text },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  }
}
