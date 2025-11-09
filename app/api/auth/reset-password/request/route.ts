import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordRequestSchema } from "@/lib/validations/auth";
import { generateToken } from "@/lib/utils";

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 3, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = resetPasswordRequestSchema.parse(body);

    // 사용자 찾기 (보안: 존재하지 않아도 성공 메시지 반환)
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (user) {
      // 재설정 토큰 생성
      const resetToken = generateToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1시간

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        },
      });

      // 개발 환경에서 콘솔에 출력
      console.log("=== 비밀번호 재설정 링크 (개발 모드) ===");
      console.log(`이메일: ${user.email}`);
      console.log(`재설정 링크: ${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`);
      console.log("================================");
    }

    // 보안: 사용자 존재 여부와 관계없이 성공 메시지 반환
    return NextResponse.json(
      { message: "비밀번호 재설정 링크가 전송되었습니다." },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

