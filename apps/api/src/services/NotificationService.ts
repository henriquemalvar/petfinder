import { Notification, PostType } from '@prisma/client';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { PostRepository } from '../repositories/PostRepository';
import { UserRepository } from '../repositories/UserRepository';
import { boundingBox, getDistanceKm } from '../utils/geo';

const RADIUS_KM = 10;
const FEED_SIZE = 30;

export class NotificationService {
  private repository: NotificationRepository;
  private postRepository: PostRepository;
  private userRepository: UserRepository;

  constructor(
    repository: NotificationRepository = new NotificationRepository(),
    postRepository: PostRepository = new PostRepository(),
    userRepository: UserRepository = new UserRepository()
  ) {
    this.repository = repository;
    this.postRepository = postRepository;
    this.userRepository = userRepository;
  }

  private buildMessage(type: PostType, petName: string) {
    switch (type) {
      case 'LOST':
        return `Pet perdido perto de você: ${petName}. Fique de olho na região.`;
      case 'FOUND':
        return `Encontraram um pet perto de você. Pode ser de alguém que conhece.`;
      case 'ADOPTION':
        return `Novo pet para adoção perto de você: ${petName}.`;
    }
  }

  /**
   * Cria notificações in-app para usuários próximos de um novo post.
   *
   * O raio é medido a partir do local do PET (onde o pet foi perdido /
   * encontrado / está para adoção), não da casa do dono: o alerta relevante
   * é "algo aconteceu perto de onde você está". Os candidatos são usuários
   * cujo endereço cadastrado (lat/lng) cai no raio.
   *
   * É deliberadamente "à prova de falhas": qualquer erro é capturado e
   * logado, nunca propagado, para que a criação/atualização do post não
   * falhe por causa de uma notificação. Chamadores devem invocar sem
   * `await` (fire-and-forget).
   */
  async notifyNearbyUsers(postId: string): Promise<void> {
    try {
      const post = await this.postRepository.findById(postId);

      if (!post || post.pet.latitude == null || post.pet.longitude == null) {
        return;
      }

      const petLat = post.pet.latitude;
      const petLon = post.pet.longitude;
      const box = boundingBox(petLat, petLon, RADIUS_KM);

      // Pré-filtro pela caixa envolvente direto no banco: reduz o conjunto de
      // candidatos antes do Haversine, em vez de trazer todos os usuários.
      const users = await this.userRepository.findWithinBoundingBox(box, post.userId);

      const nearbyUserIds = users
        .filter((u) => getDistanceKm(petLat, petLon, u.latitude!, u.longitude!) <= RADIUS_KM)
        .map((u) => u.id);

      if (!nearbyUserIds.length) return;

      const message = this.buildMessage(post.type, post.pet.name);

      await this.repository.createMany(
        nearbyUserIds.map((userId) => ({
          userId,
          postId: post.id,
          message,
        })),
      );
    } catch (error) {
      console.error(`[NotificationService] Falha ao notificar sobre o post ${postId}:`, error);
    }
  }

  async listForUser(userId: string): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const notifications = await this.repository.findByUserId(userId, FEED_SIZE);

    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.repository.markAsRead(id, userId);
  }
}
