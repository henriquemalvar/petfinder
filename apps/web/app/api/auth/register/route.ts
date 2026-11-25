import { NextRequest, NextResponse } from "next/server";
import { proxyAndStartSession } from "@/lib/server-auth-proxy";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return proxyAndStartSession(request, "/api/auth/register");
}
