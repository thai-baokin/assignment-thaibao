import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "taskpulse_token";
const JWT_SECRET = process.env.JWT_SECRET || "taskpulse-secure-jwt-secret-assignment-2-key-32chars";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, secretKey);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // Nếu đã đăng nhập mà vào lại /login hoặc /register, chuyển hướng về /teams
  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/teams", request.url));
  }

  // Bảo vệ tất cả các trang /teams/* (chỉ người dùng đăng nhập mới được truy cập)
  if (!isAuthenticated && pathname.startsWith("/teams")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/teams/:path*", "/login", "/register"],
};
