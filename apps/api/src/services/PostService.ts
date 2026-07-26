import { Post } from '@prisma/client';
import { prisma } from '../config/prisma';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/AppError';
import { PostRepository } from '../repositories/PostRepository';
import { CreatePostDTO, Paginated, Pagination, PostFilters, UpdatePostDTO } from '../types';
import { NotificationService } from './NotificationService';

export class PostService {
  private repository: PostRepository;
  private notificationService: NotificationService;

  constructor(
    repository: PostRepository = new PostRepository(),
    notificationService: NotificationService = new NotificationService()
  ) {
    this.repository = repository;
    this.notificationService = notificationService;
  }

  async findAll(pagination?: Pagination): Promise<Paginated<Post>> {
    return this.repository.findAll(pagination);
  }

  async findAllWithFilters(filters: PostFilters) {
    return this.repository.findAllWithFilters(filters);
  }

  async findById(id: string): Promise<Post> {
    const post = await this.repository.findById(id);

    if (!post) {
      throw new AppError('Post não encontrado', StatusCodes.NOT_FOUND);
    }

    return post;
  }

  async create(data: CreatePostDTO): Promise<Post> {
    const post = await this.repository.create(data);
    // Fire-and-forget: notificar não pode falhar a criação do post.
    void this.notificationService.notifyNearbyUsers(post.id);
    return post;
  }

  async update(id: string, data: UpdatePostDTO, requesterId: string): Promise<Post> {
    const post = await this.repository.findById(id);

    if (!post) {
      throw new AppError('Post não encontrado', StatusCodes.NOT_FOUND);
    }

    if (post.userId !== requesterId) {
      throw new AppError('Você não tem permissão para alterar este post', StatusCodes.FORBIDDEN);
    }

    const updated = await this.repository.update(id, data);
    // Só notifica a vizinhança enquanto o anúncio segue ativo. Marcar como
    // resolvido/cancelado não deve disparar alerta de "pet perdido na região".
    if (updated.status === 'ACTIVE') {
      void this.notificationService.notifyNearbyUsers(updated.id);
    }
    return updated;
  }

  async delete(id: string, requesterId: string): Promise<void> {
    const post = await this.repository.findById(id);

    if (!post) {
      throw new AppError('Post não encontrado', StatusCodes.NOT_FOUND);
    }

    if (post.userId !== requesterId) {
      throw new AppError('Você não tem permissão para remover este post', StatusCodes.FORBIDDEN);
    }

    await this.repository.delete(id);
  }

  async findByUserId(userId: string, pagination?: Pagination): Promise<Paginated<Post>> {
    // Verifica se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', StatusCodes.NOT_FOUND);
    }

    // Busca os posts ordenados por data de criação (mais recentes primeiro)
    return this.repository.findByUserId(userId, pagination);
  }

  async findByPetId(petId: string, pagination?: Pagination): Promise<Paginated<Post>> {
    return this.repository.findByPetId(petId, pagination);
  }
} 