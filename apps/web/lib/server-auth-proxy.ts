import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";
import { startSession } from "@/lib/server-session";

export async function proxyAndStartSession(
  request: NextRequest,
  path: string,
): Promise<NextResponse> {
  const body = await request.json();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return startSession(NextResponse.json(data), data.token);
}
