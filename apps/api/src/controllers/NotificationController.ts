import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../services/NotificationService';
import { prisma } from '../config/prisma';

export class NotificationController {
  private service: NotificationService;

  constructor() {
    this.service = new NotificationService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body as { token: string };
      await this.service.registerToken(token, req.user.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };

  notifyNearby = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.body as { postId: string };
      await this.service.notifyNearbyUsers(postId);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };

  getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      const unreadCount = notifications.filter((n) => !n.read).length;
      res.status(StatusCodes.OK).json({ notifications, unreadCount });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      await prisma.notification.updateMany({
        where: { id, userId: req.user.id },
        data: { read: true },
      });
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };
}
