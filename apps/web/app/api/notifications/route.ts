import { NextResponse } from "next/server";
import { proxy } from "@/lib/server-proxy";

export async function GET(): Promise<NextResponse> {
  return proxy("/api/notifications", { requireAuth: true, cache: "no-store" });
}
