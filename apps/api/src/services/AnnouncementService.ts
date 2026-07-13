import { PetGender, PetSize, PostStatus, PostType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/AppError';
import { CreateAnnouncementInput } from '../schemas/announcement.schema';
import { NotificationService } from './NotificationService';

export class AnnouncementService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async create(userId: string, data: CreateAnnouncementInput) {
    const { type, pet, title, content, whatsapp, instagram, contactPreference } = data;

    const defaultTitles: Record<PostType, string> = {
      LOST: `${pet.name} desapareceu`,
      FOUND: `Encontrei um ${pet.type.toLowerCase()}`,
      ADOPTION: `${pet.name} para adoção`,
    };

    const defaultContents: Record<PostType, string> = {
      LOST: `${pet.name} desapareceu na região de ${pet.location}. ${pet.description}`,
      FOUND: `Encontrei um ${pet.type.toLowerCase()} ${pet.breed.toLowerCase()} na região de ${pet.location}. ${pet.description}`,
      ADOPTION: `${pet.description}. Procura um lar amoroso e responsável.`,
    };

    const result = await prisma.$transaction(async (tx) => {
      if (whatsapp || instagram || contactPreference) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(whatsapp && { whatsapp }),
            ...(instagram && { instagram }),
            ...(contactPreference && { contactPreference }),
          },
        });
      }

      const createdPet = await tx.pet.create({
        data: {
          name: pet.name,
          type: pet.type,
          breed: pet.breed,
          age: pet.age,
          gender: pet.gender as PetGender,
          size: pet.size as PetSize,
          image: pet.image,
          description: pet.description,
          castrated: pet.castrated,
          vaccinated: pet.vaccinated,
          location: pet.location,
          latitude: pet.latitude,
          longitude: pet.longitude,
          userId,
        },
      });

      const createdPost = await tx.post.create({
        data: {
          title: title ?? defaultTitles[type as PostType],
          content: content ?? defaultContents[type as PostType],
          type: type as PostType,
          status: PostStatus.ACTIVE,
          petId: createdPet.id,
          userId,
        },
        include: {
          pet: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              whatsapp: true,
              instagram: true,
              contactPreference: true,
            },
          },
        },
      });

      return createdPost;
    });

    // Fire-and-forget: notificar não pode falhar a criação do anúncio.
    void this.notificationService.notifyNearbyUsers(result.id);
    return result;
  }
}
