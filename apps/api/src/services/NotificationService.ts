import { PostType } from '@prisma/client';
import { prisma } from '../config/prisma';

const RADIUS_KM = 10;
const KM_PER_DEGREE_LAT = 111.32;

export class NotificationService {
  /**
   * Caixa envolvente (bounding box) em torno de um ponto para um raio em km.
   * Usada para pré-filtrar candidatos no banco antes do cálculo preciso de
   * distância, evitando carregar todos os usuários em memória.
   */
  private boundingBox(lat: number, lon: number, radiusKm: number) {
    const deltaLat = radiusKm / KM_PER_DEGREE_LAT;
    const cosLat = Math.cos(lat * (Math.PI / 180));
    // Perto dos polos cosLat -> 0; evita divisão por ~0 abrindo a caixa em lon.
    const deltaLon = Math.abs(cosLat) < 1e-6 ? 180 : radiusKm / (KM_PER_DEGREE_LAT * cosLat);
    return {
      minLat: lat - deltaLat,
      maxLat: lat + deltaLat,
      minLon: lon - deltaLon,
      maxLon: lon + deltaLon,
    };
  }

  private getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { pet: true },
      });

      if (!post || post.pet.latitude == null || post.pet.longitude == null) {
        return;
      }

      const petLat = post.pet.latitude;
      const petLon = post.pet.longitude;
      const box = this.boundingBox(petLat, petLon, RADIUS_KM);

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
        .filter((u) =>
          this.getDistanceKm(petLat, petLon, u.latitude!, u.longitude!) <= RADIUS_KM,
        )
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
