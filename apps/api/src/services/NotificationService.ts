import { PostType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { boundingBox, getDistanceKm } from '../utils/geo';

const RADIUS_KM = 10;

export class NotificationService {
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
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { pet: true },
      });

      if (!post || post.pet.latitude == null || post.pet.longitude == null) {
        return;
      }

      const petLat = post.pet.latitude;
      const petLon = post.pet.longitude;
      const box = boundingBox(petLat, petLon, RADIUS_KM);

      // Pré-filtro pela caixa envolvente direto no banco: reduz o conjunto de
      // candidatos antes do Haversine, em vez de trazer todos os usuários.
      const users = await prisma.user.findMany({
        where: {
          id: { not: post.userId },
          latitude: { gte: box.minLat, lte: box.maxLat },
          longitude: { gte: box.minLon, lte: box.maxLon },
        },
        select: { id: true, latitude: true, longitude: true },
      });

      const nearbyUserIds = users
        .filter((u) => getDistanceKm(petLat, petLon, u.latitude!, u.longitude!) <= RADIUS_KM)
        .map((u) => u.id);

      if (!nearbyUserIds.length) return;

      const message = this.buildMessage(post.type, post.pet.name);

      await prisma.notification.createMany({
        data: nearbyUserIds.map((userId) => ({
          userId,
          postId: post.id,
          message,
        })),
      });
    } catch (error) {
      console.error(`[NotificationService] Falha ao notificar sobre o post ${postId}:`, error);
    }
  }
}
