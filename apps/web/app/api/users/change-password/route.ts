import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  const body = await request.json();
  const res = await fetch(`${API_URL}/api/users/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await res.json().catch(() => ({ error: "Erro ao trocar a senha" }));
  return NextResponse.json(data, { status: res.status });
}
