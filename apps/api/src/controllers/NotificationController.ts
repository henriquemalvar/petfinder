import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../services/NotificationService';

export class NotificationController {
  private service: NotificationService;

  constructor(service: NotificationService = new NotificationService()) {
    this.service = service;
  }

  getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listForUser(req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      await this.service.markAsRead(id, req.user.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };
}
