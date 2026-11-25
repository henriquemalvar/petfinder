import { NextRequest, NextResponse } from "next/server";
import { forward, toNextResponse } from "@/lib/server-proxy";
import { endSession } from "@/lib/server-session";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const res = await forward(`/api/users/${id}`, { method: "PUT", body: await request.json() });
  return toNextResponse(res);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const res = await forward(`/api/users/${id}`, { method: "DELETE", body });

  if (!res.ok) {
    return toNextResponse(res, { fallbackError: "Erro ao excluir a conta" });
  }

  return endSession(new NextResponse(null, { status: 204 }));
}
