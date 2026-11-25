import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/lib/server-proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
): Promise<NextResponse> {
  const { postId } = await params;
  return proxy(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: await request.json(),
  });
}
