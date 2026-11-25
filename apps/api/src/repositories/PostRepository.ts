import { Post, Prisma, PrismaClient } from '@prisma/client';
import { USER_SELECT } from '../constants/prismaSelect';
import { CreatePostDTO, Paginated, Pagination, PostFilters, UpdatePostDTO } from '../types';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { IRepository } from './interfaces/IRepository';
import { prisma } from '../config/prisma';

export type PostWithRelations = Prisma.PostGetPayload<{
  include: { pet: true; user: { select: typeof USER_SELECT } };
}>;

export class PostRepository implements IRepository<Post> {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(pagination: Pagination = {}): Promise<Paginated<Post>> {
    const { page, limit, skip } = resolvePagination(pagination);
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pet: true,
          user: {
            select: USER_SELECT
          }
        }
      }),
      this.prisma.post.count()
    ]);
    return buildPaginated(posts, total, page, limit);
  }

  async findById(id: string): Promise<PostWithRelations | null> {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        pet: true,
        user: {
          select: USER_SELECT
        }
      }
    });
  }

  async create(data: CreatePostDTO): Promise<Post> {
    return this.prisma.post.create({
      data,
      include: {
        pet: true,
        user: {
          select: USER_SELECT
        }
      }
    });
  }

  async findAllWithFilters(filters: PostFilters) {
    const {
      type,
      status,
      location,
      petType,
      petGender,
      petSize,
      userId,
      search,
      page = 1,
      limit = 10
    } = filters;

    const skip = (page - 1) * limit;

    const petWhere: Record<string, unknown> = {};
    if (petType) petWhere.type = petType;
    if (petGender) petWhere.gender = petGender;
    if (petSize) petWhere.size = petSize;
    if (location) petWhere.location = { contains: location, mode: 'insensitive' };

    const where: Record<string, unknown> = {
      ...(type && { type }),
      ...(status && { status }),
      ...(userId && { userId }),
      ...(Object.keys(petWhere).length > 0 && { pet: petWhere }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pet: true,
          user: {
            select: USER_SELECT
          }
        }
      }),
      this.prisma.post.count({ where })
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async update(id: string, data: UpdatePostDTO): Promise<Post> {
    return this.prisma.post.update({
      where: { id },
      data,
      include: {
        pet: true,
        user: {
          select: USER_SELECT
        }
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({
      where: { id }
    });
  }

  async findByUserId(
    userId: string,
    pagination: Pagination = {},
  ): Promise<Paginated<Post>> {
    const { page, limit, skip } = resolvePagination(pagination);
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          pet: true,
          user: {
            select: USER_SELECT
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.post.count({ where: { userId } })
    ]);
    return buildPaginated(posts, total, page, limit);
  }

  async findByPetId(
    petId: string,
    pagination: Pagination = {},
  ): Promise<Paginated<Post>> {
    const { page, limit, skip } = resolvePagination(pagination);
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { petId },
        skip,
        take: limit,
        include: {
          pet: true,
          user: {
            select: USER_SELECT
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.post.count({ where: { petId } })
    ]);
    return buildPaginated(posts, total, page, limit);
  }
}
