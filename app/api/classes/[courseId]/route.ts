import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json(
        { error: "수업 삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    const course = await (prisma as unknown as {
      course: {
        findFirst: (args: {
          where: { id: string; teacherId: string };
        }) => Promise<{ id: string } | null>;
      };
    }).course.findFirst({
      where: { id: params.courseId, teacherId: session.user.id },
    });

    if (!course) {
      return NextResponse.json(
        { error: "수업을 찾을 수 없거나 권한이 없습니다." },
        { status: 404 }
      );
    }

    await (prisma as unknown as {
      course: {
        delete: (args: { where: { id: string } }) => Promise<void>;
      };
    }).course.delete({
      where: { id: params.courseId },
    });

    return NextResponse.json(
      { message: "수업이 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json(
      { error: "수업 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


