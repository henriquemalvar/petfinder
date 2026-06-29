import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  const formData = await request.formData();
  const res = await fetch(`${API_URL}/api/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
