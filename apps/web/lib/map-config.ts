import type { PostType } from "./types";

export const CITY_COORDS: Record<string, [number, number]> = {
  "São Paulo": [-23.5505, -46.6333],
  "Rio de Janeiro": [-22.9068, -43.1729],
  "Belo Horizonte": [-19.9167, -43.9345],
  Curitiba: [-25.4284, -49.2733],
  Salvador: [-12.9714, -38.5014],
};

export const MAP_TILES = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
};

export const PIN_CONFIG: Record<
  PostType,
  { color: string; glow: string; icon: string; label: string }
> = {
  LOST: { color: "#f59e0b", glow: "rgba(245,158,11,0.35)", icon: "!", label: "Perdido" },
  FOUND: { color: "#06b6d4", glow: "rgba(6,182,212,0.35)", icon: "✓", label: "Encontrado" },
  ADOPTION: { color: "#0066ff", glow: "rgba(0,102,255,0.35)", icon: "♥", label: "Adoção" },
};

export const DEFAULT_MAP_CENTER: [number, number] = [-23.5505, -46.6333];

export function getHeroCardOcclusionWidth(mapWidth: number): number {
  if (mapWidth >= 1280) return Math.round(Math.min(mapWidth * 0.54, 780));
  if (mapWidth >= 768) return Math.round(Math.min(mapWidth * 0.58, 580));
  return Math.round(mapWidth * 0.1);
}

export function isPostVisibleOnHeroMap(
  lat: number,
  lng: number,
  mapWidth: number,
  mapHeight: number,
  toContainerPoint: (coords: [number, number]) => { x: number; y: number },
): boolean {
  const point = toContainerPoint([lat, lng]);
  const minX = getHeroCardOcclusionWidth(mapWidth) + 100;
  return (
    point.x >= minX &&
    point.x <= mapWidth - 120 &&
    point.y >= 64 &&
    point.y <= mapHeight - 64
  );
}

export const HERO_TOUR_TOOLTIP = { width: 220, height: 196 };

export function computeHeroTourTooltipPosition(
  pinX: number,
  pinY: number,
  mapWidth: number,
  mapHeight: number,
): { x: number; y: number } {
  const { width: tooltipW, height: tooltipH } = HERO_TOUR_TOOLTIP;
  const margin = 16;
  const minX = getHeroCardOcclusionWidth(mapWidth) + margin;

  let x = pinX - tooltipW / 2;
  x = Math.max(minX, Math.min(x, mapWidth - tooltipW - margin));

  let y = pinY - tooltipH - 40;
  if (y < margin) {
    y = pinY + 40;
  }
  y = Math.max(margin, Math.min(y, mapHeight - tooltipH - margin));

  return { x: Math.round(x), y: Math.round(y) };
}

export function createPinHtml(type: PostType, selected = false) {
  const config = PIN_CONFIG[type];
  const pulse = type === "LOST" ? `<span class="pet-map-marker__pulse" style="--pin-glow:${config.glow}"></span>` : "";
  const scale = selected ? "transform:scale(1.15);" : "";

  return `
    <div class="pet-map-marker ${selected ? "pet-map-marker--selected" : ""}" style="${scale}">
      ${pulse}
      <span class="pet-map-marker__dot" style="--pin-color:${config.color};--pin-glow:${config.glow}">
        ${config.icon}
      </span>
    </div>
  `;
}
