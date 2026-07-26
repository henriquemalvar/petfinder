import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../config/prisma';

export class NotificationController {
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
