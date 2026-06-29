import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const res = await fetch(`${API_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
