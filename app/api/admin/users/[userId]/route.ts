import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const userId = params.userId;
    const body = await request.json();

    // 사용자 존재 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 이메일 중복 확인 (다른 사용자가 이미 사용 중인지)
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: body.email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: "이미 사용 중인 이메일입니다." },
          { status: 400 }
        );
      }
    }

    // 사용자 기본 정보 업데이트
    const updateData: any = {};
    if (body.email !== undefined) updateData.email = body.email;
    if (body.name !== undefined) updateData.name = body.name || null;
    if (body.school !== undefined) updateData.school = body.school || null;
    if (body.role !== undefined) updateData.role = body.role || null;

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // 학생 프로필 업데이트 (역할이 student인 경우)
    if (body.role === "student" || existingUser.role === "student") {
      const prismaAny = prisma as any;
      const studentProfileData: any = {};
      
      if (body.studentId !== undefined) studentProfileData.studentId = body.studentId || null;
      if (body.grade !== undefined) studentProfileData.grade = body.grade || null;
      if (body.className !== undefined) studentProfileData.classLabel = body.className || null;

      if (Object.keys(studentProfileData).length > 0) {
        if (existingUser.studentProfile) {
          // 기존 프로필 업데이트
          await prismaAny.studentProfile.update({
            where: { userId: userId },
            data: studentProfileData,
          });
        } else if (body.role === "student") {
          // 새 프로필 생성
          await prismaAny.studentProfile.create({
            data: {
              userId: userId,
              ...studentProfileData,
            },
          });
        }
      }
    }

    return NextResponse.json({
      message: "사용자 정보가 업데이트되었습니다.",
    });
  } catch (error: any) {
    console.error("User update error:", error);
    return NextResponse.json(
      {
        error: "사용자 정보 업데이트 중 오류가 발생했습니다.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

