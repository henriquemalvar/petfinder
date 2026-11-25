import { PrismaClient, User } from '@prisma/client';
import { USER_SELECT } from '../constants/prismaSelect';
import { AuthenticatedUser, BoundingBox, CreateUserDTO, GeolocatedUser, UpdateUserDTO } from '../types';
import { IRepository } from './interfaces/IRepository';
import { prisma } from '../config/prisma';

export class UserRepository implements IRepository<User> {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: CreateUserDTO): Promise<User> {
    return this.prisma.user.create({
      data
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findPublicById(id: string): Promise<AuthenticatedUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT
    });
  }

  async findWithinBoundingBox(box: BoundingBox, excludeUserId: string): Promise<GeolocatedUser[]> {
    return this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        latitude: { gte: box.minLat, lte: box.maxLat },
        longitude: { gte: box.minLon, lte: box.maxLon }
      },
      select: { id: true, latitude: true, longitude: true }
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async update(id: string, data: UpdateUserDTO): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
  }
} 