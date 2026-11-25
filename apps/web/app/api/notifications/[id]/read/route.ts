import { NextResponse } from "next/server";
import { proxy } from "@/lib/server-proxy";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  return proxy(`/api/notifications/${id}/read`, { method: "PATCH", requireAuth: true });
}
