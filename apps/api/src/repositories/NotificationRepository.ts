import { Notification, PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface NotificationDraft {
  userId: string;
  postId: string;
  message: string;
}

export class NotificationRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findByUserId(userId: string, take: number): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take
    });
  }

  async createMany(drafts: NotificationDraft[]): Promise<void> {
    await this.prisma.notification.createMany({ data: drafts });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true }
    });
  }
}
