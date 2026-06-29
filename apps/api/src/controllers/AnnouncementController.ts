import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AnnouncementService } from '../services/AnnouncementService';

export class AnnouncementController {
  private service: AnnouncementService;

  constructor() {
    this.service = new AnnouncementService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await this.service.create(req.user.id, req.body);
      res.status(StatusCodes.CREATED).json(post);
    } catch (error) {
      next(error);
    }
  };
}
