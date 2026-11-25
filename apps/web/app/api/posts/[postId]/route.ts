import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/lib/server-proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
): Promise<NextResponse> {
  const { postId } = await params;
  return proxy(`/api/posts/${postId}`, { method: "PATCH", body: await request.json() });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
): Promise<NextResponse> {
  const { postId } = await params;
  return proxy(`/api/posts/${postId}`, { method: "DELETE", emptyOn: [200] });
}
