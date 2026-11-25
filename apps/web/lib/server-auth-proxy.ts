import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";
import { startSession } from "@/lib/server-session";

export const PLATFORM_CLIENT_IP_HEADER = "x-vercel-forwarded-for";

export function visitorIp(request: NextRequest): string | undefined {
  return request.headers.get(PLATFORM_CLIENT_IP_HEADER)?.split(",")[0]?.trim() || undefined;
}

export function clientIpHeaders(request: NextRequest): Record<string, string> {
  const secret = process.env.AUTH_PROXY_SECRET;
  const ip = visitorIp(request);
  if (!secret || !ip) return {};
  return { "x-client-ip": ip, "x-proxy-secret": secret };
}

export async function proxyAndStartSession(
  request: NextRequest,
  path: string,
): Promise<NextResponse> {
  const body = await request.json();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...clientIpHeaders(request) },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return startSession(NextResponse.json(data), data.token);
}
