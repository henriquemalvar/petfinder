import { cookies } from "next/headers";
import { API_URL } from "./utils";
import type {
  AnnouncementPayload,
  ApiComment,
  ApiPost,
  AuthResponse,
  PostFilters,
  PostsResponse,
} from "./types";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || "Erro na requisição", res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getPosts(filters: PostFilters = {}) {
  return apiFetch<PostsResponse>(`/api/posts${buildQuery(filters as Record<string, string | number | undefined>)}`);
}

export async function getPost(id: string) {
  return apiFetch<ApiPost>(`/api/posts/${id}`);
}

export async function getComments(postId: string) {
  return apiFetch<ApiComment[]>(`/api/posts/${postId}/comments`);
}

export async function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(name: string, email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function createAnnouncement(data: AnnouncementPayload) {
  return apiFetch<ApiPost>("/api/announcements", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createComment(postId: string, text: string) {
  return apiFetch<ApiComment>(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function uploadImage(file: File) {
  const token = await getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || "Erro no upload", res.status);
  }

  return res.json() as Promise<{ url: string }>;
}

export { ApiError };
