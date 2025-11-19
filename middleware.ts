import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // 추가 미들웨어 로직이 필요한 경우 여기에 작성
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 보호된 라우트 확인
        const { pathname } = req.nextUrl;

        if (!token) {
          return false;
        }

        if (pathname.startsWith("/dashboard/teacher")) {
          return token.role === "teacher";
        }

        if (pathname.startsWith("/dashboard/student")) {
          return token.role === "student";
        }

        if (pathname.startsWith("/dashboard")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/auth/reset-password/:path*",
    "/api/auth/verify-email/:path*",
  ],
};

