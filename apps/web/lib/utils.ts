import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PostType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const POST_TYPE_LABEL: Record<PostType, string> = {
  LOST: "Perdido",
  FOUND: "Encontrado",
  ADOPTION: "Adoção",
};

export const POST_TYPE_COLORS: Record<PostType, string> = {
  LOST: "bg-warning/20 text-warning border-warning/30",
  FOUND: "bg-info/20 text-info border-info/30",
  ADOPTION: "bg-tertiary/20 text-tertiary border-tertiary/30",
};

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Agora há pouco";
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

/**
 * Garante que um redirect vindo da URL aponte para uma rota interna,
 * evitando open-redirect (ex.: ?redirect=https://evil.com ou //evil.com).
 */
export function safeRedirect(target: string | null | undefined, fallback = "/") {
  if (!target) return fallback;
  if (!target.startsWith("/")) return fallback;
  if (target.startsWith("//") || target.startsWith("/\\")) return fallback;
  return target;
}

export function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
