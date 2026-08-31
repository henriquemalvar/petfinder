import { NextResponse } from "next/server";

const SESSION_COOKIE = "token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function startSession(response: NextResponse, token: string): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export function endSession(response: NextResponse): NextResponse {
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
