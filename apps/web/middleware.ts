import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/post", "/profile"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  const { pathname } = request.nextUrl;

  if (protectedPaths.some((p) => pathname.startsWith(p)) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/post/:path*", "/profile/:path*"],
};
