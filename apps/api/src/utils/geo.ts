export const KM_PER_DEGREE_LAT = 111.32;
const EARTH_RADIUS_KM = 6371;

/**
 * Caixa envolvente (bounding box) em torno de um ponto para um raio em km.
 * Usada para pré-filtrar candidatos no banco antes do cálculo preciso de
 * distância, evitando carregar todos os usuários em memória.
 */
export function boundingBox(lat: number, lon: number, radiusKm: number) {
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

/**
 * Distância em km entre dois pontos (Haversine).
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
