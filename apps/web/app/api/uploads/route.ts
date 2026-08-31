import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/lib/server-proxy";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return proxy("/api/uploads", { method: "POST", formData: await request.formData() });
}
