"use client";

import { MAX_UPLOAD_BYTES, UploadTooLarge, shrinkImage } from "@/lib/image-upload";
import type { AuthResponse } from "@/lib/types";

export async function clientLogin(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao entrar");
  }
  return res.json() as Promise<AuthResponse>;
}

export async function clientRegister(name: string, email: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao registrar");
  }
  return res.json() as Promise<AuthResponse>;
}

export async function clientGoogleLogin(credential: string) {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao entrar com Google");
  }
  return res.json() as Promise<AuthResponse>;
}

export async function clientLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function clientUpload(file: File) {
  const prepared = await shrinkImage(file);
  if (prepared.size > MAX_UPLOAD_BYTES) {
    throw new UploadTooLarge();
  }
  const formData = new FormData();
  formData.append("file", prepared);
  const res = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro no upload");
  }
  return res.json() as Promise<{ url: string }>;
}
