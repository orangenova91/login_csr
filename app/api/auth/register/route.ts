import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { registerSchema } from "@/lib/validations/auth";
import { generateToken } from "@/lib/utils";

// Rate limiting을 위한 간단한 메모리 저장소 (프로덕션에서는 Redis 사용 권장)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 5, windowMs = 15 * 60 * 1000): boolean {
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
    const validatedData = registerSchema.parse(body);

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      // 보안: 일반적인 에러 메시지 반환
      return NextResponse.json(
        { error: "회원가입 중 오류가 발생했습니다." },
        { status: 400 }
      );
    }

    // 비밀번호 해시
    const hashedPassword = await hashPassword(validatedData.password);

    // 이메일 인증 토큰 생성 (옵션)
    let verificationToken: string | undefined;
    let verificationExpires: Date | undefined;

    if (process.env.ENABLE_EMAIL_VERIFICATION === "true") {
      verificationToken = generateToken();
      verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
    }

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        hashedPassword,
        name: validatedData.name,
        school: validatedData.school,
        role: validatedData.role,
        verificationToken,
        verificationExpires,
        emailVerified: process.env.ENABLE_EMAIL_VERIFICATION === "true" ? null : new Date(),
      },
    });

    // 이메일 인증이 활성화된 경우 이메일 전송 (목업)
    if (process.env.ENABLE_EMAIL_VERIFICATION === "true" && verificationToken) {
      // 개발 환경에서 콘솔에 출력
      console.log("=== 이메일 인증 링크 (개발 모드) ===");
      console.log(`이메일: ${user.email}`);
      console.log(`인증 링크: ${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`);
      console.log("================================");
    }

    return NextResponse.json(
      {
        message: "회원가입이 완료되었습니다.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

