import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  const body = await request.json();
  const res = await fetch(`${API_URL}/api/announcements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
