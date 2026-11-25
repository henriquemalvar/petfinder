import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/AppError';
import { PetService } from '../services/PetService';
import { CreatePetDTO, UpdatePetDTO } from '../types';

export class PetController {
  private petService: PetService;

  constructor() {
    this.petService = new PetService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const petData: CreatePetDTO = {
        ...req.body,
        userId: req.user.id
      };
      const pet = await this.petService.create(petData);
      res.status(StatusCodes.CREATED).json(pet);
    } catch (error) {
      next(error);
      return;
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pets = await this.petService.findAll({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.status(StatusCodes.OK).json(pets);
    } catch (error) {
      next(error);
      return;
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const pet = await this.petService.findById(id);
      res.status(StatusCodes.OK).json(pet);
    } catch (error) {
      next(error);
      return;
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const petData: UpdatePetDTO = req.body;
      const pet = await this.petService.update(id, petData, req.user.id);
      res.status(StatusCodes.OK).json(pet);
    } catch (error) {
      next(error);
      return;
    }
  };

  patch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const petData: Partial<UpdatePetDTO> = req.body;
      const pet = await this.petService.update(id, petData, req.user.id);
      res.status(StatusCodes.OK).json(pet);
    } catch (error) {
      next(error);
      return;
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      await this.petService.delete(id, req.user.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
      return;
    }
  };

  findByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.params.userId);
      
      // Verifica se o usuário está tentando acessar seus próprios pets
      if (userId !== req.user.id) {
        throw new AppError('Não autorizado a acessar pets de outro usuário', StatusCodes.FORBIDDEN);
      }

      const pets = await this.petService.findByUserId(userId, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.status(StatusCodes.OK).json(pets);
    } catch (error) {
      next(error);
      return;
    }
  };
}
