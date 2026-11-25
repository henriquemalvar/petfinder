import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma';
import { USER_SELECT } from '../constants/prismaSelect';
import { Paginated, PetCreate, PetResponse, Pagination } from '../types';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { IRepository } from './interfaces/IRepository';

export class PetRepository implements IRepository<PetResponse> {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(pagination: Pagination = {}): Promise<Paginated<PetResponse>> {
    const { page, limit, skip } = resolvePagination(pagination);
    const [pets, total] = await Promise.all([
      this.prisma.pet.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: USER_SELECT
          },
          posts: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }),
      this.prisma.pet.count()
    ]);
    return buildPaginated(pets, total, page, limit);
  }

  async findById(id: string): Promise<PetResponse | null> {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
      include: {
        user: {
          select: USER_SELECT
        },
        posts: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    return pet;
  }

  async create(data: PetCreate): Promise<PetResponse> {
    const pet = await this.prisma.pet.create({
      data,
      include: {
        user: {
          select: USER_SELECT
        },
        posts: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    return pet;
  }

  async update(id: string, data: Partial<PetCreate>): Promise<PetResponse> {
    const pet = await this.prisma.pet.update({
      where: { id },
      data,
      include: {
        user: {
          select: USER_SELECT
        },
        posts: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    return pet;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.pet.delete({
      where: { id }
    });
  }

  async findByUserId(
    userId: string,
    pagination: Pagination = {},
  ): Promise<Paginated<PetResponse>> {
    const { page, limit, skip } = resolvePagination(pagination);
    const [pets, total] = await Promise.all([
      this.prisma.pet.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          user: {
            select: USER_SELECT
          },
          posts: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.pet.count({ where: { userId } })
    ]);
    return buildPaginated(pets, total, page, limit);
  }
} 