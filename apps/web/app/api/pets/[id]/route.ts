import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/lib/server-proxy";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  return proxy(`/api/pets/${id}`, { method: "PUT", body: await request.json() });
}
