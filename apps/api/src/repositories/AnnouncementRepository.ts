import { Prisma, PrismaClient } from '@prisma/client';
import { USER_SELECT } from '../constants/prismaSelect';
import { prisma } from '../config/prisma';

export type AnnouncementDraft = {
  userId: string;
  contact: Prisma.UserUpdateInput | null;
  pet: Prisma.PetUncheckedCreateWithoutPostsInput;
  post: Omit<Prisma.PostUncheckedCreateInput, 'petId'>;
};

export type CreatedAnnouncement = Prisma.PostGetPayload<{
  include: { pet: true; user: { select: typeof USER_SELECT } };
}>;

export class AnnouncementRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(draft: AnnouncementDraft): Promise<CreatedAnnouncement> {
    return this.prisma.$transaction(async (tx) => {
      if (draft.contact) {
        await tx.user.update({ where: { id: draft.userId }, data: draft.contact });
      }

      const createdPet = await tx.pet.create({ data: draft.pet });

      return tx.post.create({
        data: { ...draft.post, petId: createdPet.id },
        include: {
          pet: true,
          user: { select: USER_SELECT }
        }
      });
    });
  }
}
