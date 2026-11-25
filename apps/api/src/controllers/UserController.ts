import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../services/UserService';
import { CreateUserDTO, UpdateUserDTO } from '../types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: CreateUserDTO = req.body;
      const user = await this.userService.create(userData);
      res.status(StatusCodes.CREATED).json(user);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.findAll();
      res.status(StatusCodes.OK).json(users);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const user = await this.userService.findById(id);
      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const userData: UpdateUserDTO = req.body;
      const user = await this.userService.update(id, userData, req.user.id);
      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      next(error);
    }
  };

  patch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const userData: Partial<UpdateUserDTO> = req.body;
      const user = await this.userService.update(id, userData, req.user.id);
      res.status(StatusCodes.OK).json(user);
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };
      await this.userService.changePassword(req.user.id, currentPassword, newPassword);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const { password } = (req.body ?? {}) as { password?: string };
      await this.userService.delete(id, req.user.id, password);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };
} 