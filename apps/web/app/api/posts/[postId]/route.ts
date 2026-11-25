import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";

async function authHeaders(): Promise<Record<string, string>> {
  const token = (await cookies()).get("token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const body = await request.json();
  const res = await fetch(`${API_URL}/api/posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const res = await fetch(`${API_URL}/api/posts/${postId}`, {
    method: "DELETE",
    headers: { ...(await authHeaders()) },
  });
  // A API responde 204 sem corpo no delete; não tente parsear JSON.
  if (res.status === 204 || res.status === 200) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
