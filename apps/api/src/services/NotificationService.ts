import { prisma } from '../config/prisma';
import fetch from 'node-fetch';
import { NotificationTokenRepository } from '../repositories/NotificationTokenRepository';

const RADIUS_KM = 10;
const KM_PER_DEGREE_LAT = 111.32;

export class NotificationService {
  private tokenRepo: NotificationTokenRepository;

  constructor() {
    this.tokenRepo = new NotificationTokenRepository();
  }

  async registerToken(token: string, userId: string) {
    await this.tokenRepo.upsert(token, userId);
  }

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

  async notifyNearbyUsers(postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true
      }
    });

    if (!post || post.user.latitude == null || post.user.longitude == null) {
      return;
    }

    const ownerLat = post.user.latitude;
    const ownerLon = post.user.longitude;
    const box = this.boundingBox(ownerLat, ownerLon, RADIUS_KM);

    // Pré-filtro pela caixa envolvente direto no banco: reduz o conjunto de
    // candidatos antes do Haversine, em vez de trazer todos os usuários.
    const users = await prisma.user.findMany({
      where: {
        id: { not: post.userId },
        latitude: { gte: box.minLat, lte: box.maxLat },
        longitude: { gte: box.minLon, lte: box.maxLon }
      },
      select: { id: true, latitude: true, longitude: true }
    });

    const nearbyUserIds = users
      .filter(u =>
        this.getDistanceKm(ownerLat, ownerLon, u.latitude!, u.longitude!) <= RADIUS_KM
      )
      .map(u => u.id);

    if (!nearbyUserIds.length) return;

    const tokens = await this.tokenRepo.findByUserIds(nearbyUserIds);

    const messages = tokens.map(t => ({ to: t.token, sound: 'default', body: 'Há um novo post perto de você!' }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages)
    });
  }
}
