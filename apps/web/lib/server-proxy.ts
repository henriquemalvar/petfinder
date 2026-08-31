import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";

type ProxyInit = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  requireAuth?: boolean;
  cache?: RequestCache;
};

type ProxyOptions = ProxyInit & {
  emptyOn?: number[];
  fallbackError?: string;
};

export class Unauthorized extends Error {}

export async function forward(path: string, init: ProxyInit = {}): Promise<Response> {
  const { method = "GET", body, formData, requireAuth = false, cache } = init;
  const token = (await cookies()).get("token")?.value;

  if (requireAuth && !token) {
    throw new Unauthorized();
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
    ...(formData && { body: formData }),
    ...(cache && { cache }),
  });
}

export async function toNextResponse(
  res: Response,
  { emptyOn = [], fallbackError }: Pick<ProxyOptions, "emptyOn" | "fallbackError"> = {},
): Promise<NextResponse> {
  if (res.status === 204 || emptyOn.includes(res.status)) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await res
    .json()
    .catch(() => (fallbackError ? { error: fallbackError } : {}));

  return NextResponse.json(data, { status: res.status });
}

export async function proxy(path: string, options: ProxyOptions = {}): Promise<NextResponse> {
  const { emptyOn, fallbackError, ...init } = options;

  try {
    const res = await forward(path, init);
    return await toNextResponse(res, { emptyOn, fallbackError });
  } catch (error) {
    if (error instanceof Unauthorized) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    throw error;
  }
}
