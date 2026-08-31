import { NextResponse } from "next/server";
import { endSession } from "@/lib/server-session";

export async function POST(): Promise<NextResponse> {
  return endSession(NextResponse.json({ ok: true }));
}
