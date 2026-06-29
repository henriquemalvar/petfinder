import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CommentService } from '../services/CommentService';

export class CommentController {
  private service: CommentService;

  constructor() {
    this.service = new CommentService();
  }

  findByPostId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = String(req.params.postId);
      const comments = await this.service.findByPostId(postId);
      res.status(StatusCodes.OK).json(comments);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = String(req.params.postId);
      const comment = await this.service.create(postId, req.user.id, req.body.text);
      res.status(StatusCodes.CREATED).json(comment);
    } catch (error) {
      next(error);
    }
  };
}
