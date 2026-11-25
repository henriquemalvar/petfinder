import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/lib/server-proxy";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return proxy("/api/users/change-password", {
    method: "POST",
    body: await request.json(),
    emptyOn: [200],
    fallbackError: "Erro ao trocar a senha",
  });
}
