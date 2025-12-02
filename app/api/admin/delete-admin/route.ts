import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    // 슈퍼어드민 권한 확인
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "슈퍼어드민 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { adminId } = body;

    if (!adminId || typeof adminId !== "string") {
      return NextResponse.json(
        { error: "Admin ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Admin 계정 존재 확인
    const existingAdmin = await prisma.user.findUnique({
      where: { id: adminId },
      include: {
        adminProfile: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!existingAdmin || existingAdmin.role !== "admin") {
      return NextResponse.json(
        { error: "Admin 계정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // User 삭제 (Cascade로 School과 AdminProfile도 자동 삭제됨)
    await prisma.user.delete({
      where: { id: adminId },
    });

    return NextResponse.json(
      {
        message: "Admin 계정이 성공적으로 삭제되었습니다.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Admin 계정 삭제 오류:", error);
    return NextResponse.json(
      { error: "Admin 계정 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

