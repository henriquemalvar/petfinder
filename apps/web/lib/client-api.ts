"use client";

import { API_URL } from "@/lib/utils";
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
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/uploads`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erro no upload");
  return res.json() as Promise<{ url: string }>;
}

export async function clientCreateAnnouncement(data: unknown) {
  const res = await fetch(`${API_URL}/api/announcements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao publicar");
  }
  return res.json();
}

export async function clientCreateComment(postId: string, text: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Erro ao comentar");
  return res.json();
}
