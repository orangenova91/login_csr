import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // 토큰으로 사용자 찾기
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: validatedData.token,
        resetPasswordExpires: {
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

    // 비밀번호 해시
    const hashedPassword = await hashPassword(validatedData.password);

    // 비밀번호 업데이트 및 토큰 제거
    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json(
      { message: "비밀번호가 성공적으로 변경되었습니다." },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Password reset confirm error:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

