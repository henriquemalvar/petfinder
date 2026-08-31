import { PetGender, PetSize, PostStatus, PostType, Prisma } from '@prisma/client';
import { AnnouncementRepository, CreatedAnnouncement } from '../repositories/AnnouncementRepository';
import { CreateAnnouncementInput } from '../schemas/announcement.schema';
import { NotificationService } from './NotificationService';

export class AnnouncementService {
  private repository: AnnouncementRepository;
  private notificationService: NotificationService;

  constructor(
    repository: AnnouncementRepository = new AnnouncementRepository(),
    notificationService: NotificationService = new NotificationService()
  ) {
    this.repository = repository;
    this.notificationService = notificationService;
  }

  async create(userId: string, data: CreateAnnouncementInput): Promise<CreatedAnnouncement> {
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

    const contact: Prisma.UserUpdateInput = {
      ...(whatsapp && { whatsapp }),
      ...(instagram && { instagram }),
      ...(contactPreference && { contactPreference }),
    };

    const result = await this.repository.create({
      userId,
      contact: Object.keys(contact).length ? contact : null,
      pet: {
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
      post: {
        title: title ?? defaultTitles[type as PostType],
        content: content ?? defaultContents[type as PostType],
        type: type as PostType,
        status: PostStatus.ACTIVE,
        userId,
      },
    });

    // Fire-and-forget: notificar não pode falhar a criação do anúncio.
    void this.notificationService.notifyNearbyUsers(result.id);
    return result;
  }
}
