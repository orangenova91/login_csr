import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { existsSync } from "fs";
import { join } from "path";
import { unlink } from "fs/promises";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; assignmentId: string; attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json({ error: "첨부 삭제 권한이 없습니다." }, { status: 403 });
    }

    // 과제 소유권 확인
    const assignment = await (prisma as any).assignment.findFirst({
      where: {
        id: params.assignmentId,
        courseId: params.courseId,
        teacherId: session.user.id,
      },
      select: { id: true },
    });
    if (!assignment) {
      return NextResponse.json(
        { error: "수업 자료를 찾을 수 없거나 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 첨부 존재 및 소속 확인
    const attachment = await (prisma as any).assignmentAttachment.findFirst({
      where: { id: params.attachmentId, assignmentId: params.assignmentId },
    });
    if (!attachment) {
      return NextResponse.json(
        { error: "첨부 파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 파일 삭제
    if (attachment.filePath) {
      const filePathOnDisk = join(process.cwd(), "public", attachment.filePath);
      if (existsSync(filePathOnDisk)) {
        try {
          await unlink(filePathOnDisk);
        } catch (err) {
          console.error("Failed to delete attachment file:", err);
          // 파일 삭제 실패해도 DB 레코드는 삭제 진행
        }
      }
    }

    // 레코드 삭제
    await (prisma as any).assignmentAttachment.delete({
      where: { id: params.attachmentId },
    });

    return NextResponse.json({ message: "첨부가 삭제되었습니다." }, { status: 200 });
  } catch (error) {
    console.error("Delete attachment error:", error);
    return NextResponse.json(
      { error: "첨부 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


