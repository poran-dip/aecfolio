import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  // Public paths that don't need auth
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/";

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect logged-in users away from login page
  if (isLoggedIn && pathname === "/login") {
    const role = req.auth?.user?.role;
    const dest =
      role === "FACULTY"
        ? "/faculty"
        : role === "ADMIN"
          ? "/admin"
          : "/student";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Role-based route guards for dashboard routes
  if (isLoggedIn) {
    const role = req.auth?.user?.role;

    if (pathname.startsWith("/student") && role !== "STUDENT") {
      return NextResponse.redirect(new URL("/faculty", req.url));
    }
    if (pathname.startsWith("/faculty") && role !== "FACULTY" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/student", req.url));
    }
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/student", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
