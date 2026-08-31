import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/AppError';
import { PetRepository } from '../repositories/PetRepository';
import { UserRepository } from '../repositories/UserRepository';
import { CreatePetDTO, Paginated, Pagination, PetCreate, PetResponse, UpdatePetDTO } from '../types';

export class PetService {
  private repository: PetRepository;
  private userRepository: UserRepository;

  constructor(
    repository: PetRepository = new PetRepository(),
    userRepository: UserRepository = new UserRepository()
  ) {
    this.repository = repository;
    this.userRepository = userRepository;
  }

  async findAll(pagination?: Pagination): Promise<Paginated<PetResponse>> {
    return this.repository.findAll(pagination);
  }

  async findById(id: string): Promise<PetResponse> {
    const pet = await this.repository.findById(id);

    if (!pet) {
      throw new AppError('Pet não encontrado', StatusCodes.NOT_FOUND);
    }

    return pet;
  }

  async create(data: CreatePetDTO): Promise<PetResponse> {
    return this.repository.create(data as PetCreate);
  }

  async update(id: string, data: UpdatePetDTO, requesterId: string): Promise<PetResponse> {
    const pet = await this.repository.findById(id);

    if (!pet) {
      throw new AppError('Pet não encontrado', StatusCodes.NOT_FOUND);
    }

    if (pet.userId !== requesterId) {
      throw new AppError('Você não tem permissão para alterar este pet', StatusCodes.FORBIDDEN);
    }

    return this.repository.update(id, data);
  }

  async delete(id: string, requesterId: string): Promise<void> {
    const pet = await this.repository.findById(id);

    if (!pet) {
      throw new AppError('Pet não encontrado', StatusCodes.NOT_FOUND);
    }

    if (pet.userId !== requesterId) {
      throw new AppError('Você não tem permissão para remover este pet', StatusCodes.FORBIDDEN);
    }

    await this.repository.delete(id);
  }

  async findByUserId(userId: string, pagination?: Pagination): Promise<Paginated<PetResponse>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', StatusCodes.NOT_FOUND);
    }

    return this.repository.findByUserId(userId, pagination);
  }
} 