import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyEmailSchema.parse(body);

    // 토큰으로 사용자 찾기
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: validatedData.token,
        verificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "유효하지 않거나 만료된 토큰입니다." },
        { status: 400 }
      );
    }

    // 이메일 인증 완료
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationExpires: null,
      },
    });

    return NextResponse.json(
      { message: "이메일이 성공적으로 인증되었습니다." },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "이메일 인증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

