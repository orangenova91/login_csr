import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateAssignmentSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요").max(200, "제목은 200자 이하여야 합니다"),
  description: z.string().trim().max(5000, "설명은 5000자 이하여야 합니다").optional(),
  dueDate: z.string().optional(), // ISO string
});

// 파일 업로드 허용 확장자
const ALLOWED_EXTENSIONS = [
  ".ppt", ".pptx", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip",
  ".hwp", ".hwpx", // 한글 파일
  ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", // 이미지 파일
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string; assignmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json(
        { error: "과제 수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 과제 소유권 확인
    const existingAssignment = await (prisma as unknown as {
      assignment: {
        findFirst: (args: {
          where: { id: string; courseId: string; teacherId: string };
        }) => Promise<{
          id: string;
          filePath: string | null;
        } | null>;
      };
    }).assignment.findFirst({
      where: {
        id: params.assignmentId,
        courseId: params.courseId,
        teacherId: session.user.id,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "과제를 찾을 수 없거나 권한이 없습니다." },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const dueDateStr = formData.get("dueDate") as string | null;
    const file = formData.get("file") as File | null;
    const removeFile = formData.get("removeFile") === "true";

    // 데이터 검증
    const validatedData = updateAssignmentSchema.parse({
      title,
      description: description || undefined,
      dueDate: dueDateStr || undefined,
    });

    let filePath: string | null = existingAssignment.filePath;
    let originalFileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;

    // 기존 파일 삭제 처리
    if (removeFile && existingAssignment.filePath) {
      const oldFilePath = join(process.cwd(), "public", existingAssignment.filePath);
      if (existsSync(oldFilePath)) {
        try {
          await unlink(oldFilePath);
        } catch (err) {
          console.error("Failed to delete old file:", err);
        }
      }
      filePath = null;
    }

    // 새 파일 업로드 처리
    if (file && file.size > 0) {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `허용되지 않는 파일 형식입니다. 허용 형식: ${ALLOWED_EXTENSIONS.join(", ")}` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다.` },
          { status: 400 }
        );
      }

      // 기존 파일이 있으면 삭제
      if (existingAssignment.filePath) {
        const oldFilePath = join(process.cwd(), "public", existingAssignment.filePath);
        if (existsSync(oldFilePath)) {
          try {
            await unlink(oldFilePath);
          } catch (err) {
            console.error("Failed to delete old file:", err);
          }
        }
      }

      // 새 파일 저장
      const uploadsDir = join(process.cwd(), "public", "uploads", "assignments");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const sanitizedFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePathOnDisk = join(uploadsDir, sanitizedFileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePathOnDisk, buffer);

      filePath = `/uploads/assignments/${sanitizedFileName}`;
      originalFileName = file.name;
      fileSize = file.size;
      mimeType = file.type || "application/octet-stream";
    }

    // 과제 업데이트
    const updateData: any = {
      title: validatedData.title,
      description: validatedData.description || null,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
    };

    if (filePath !== existingAssignment.filePath) {
      updateData.filePath = filePath;
      updateData.originalFileName = originalFileName;
      updateData.fileSize = fileSize;
      updateData.mimeType = mimeType;
    }

    const assignment = await (prisma as unknown as {
      assignment: {
        update: (args: {
          where: { id: string };
          data: any;
        }) => Promise<{
          id: string;
          title: string;
          description: string | null;
          filePath: string | null;
          originalFileName: string | null;
          createdAt: Date;
          dueDate: Date | null;
        }>;
      };
    }).assignment.update({
      where: { id: params.assignmentId },
      data: updateData,
    });

    return NextResponse.json(
      {
        message: "과제가 수정되었습니다.",
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          filePath: assignment.filePath,
          originalFileName: assignment.originalFileName,
          createdAt: assignment.createdAt.toISOString(),
          dueDate: assignment.dueDate?.toISOString() || null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update assignment error:", error);
    return NextResponse.json(
      { error: "과제 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; assignmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json(
        { error: "과제 삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 과제 소유권 확인
    const existingAssignment = await (prisma as unknown as {
      assignment: {
        findFirst: (args: {
          where: { id: string; courseId: string; teacherId: string };
        }) => Promise<{
          id: string;
          filePath: string | null;
        } | null>;
      };
    }).assignment.findFirst({
      where: {
        id: params.assignmentId,
        courseId: params.courseId,
        teacherId: session.user.id,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "과제를 찾을 수 없거나 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 파일 삭제
    if (existingAssignment.filePath) {
      const filePathOnDisk = join(process.cwd(), "public", existingAssignment.filePath);
      if (existsSync(filePathOnDisk)) {
        try {
          await unlink(filePathOnDisk);
        } catch (err) {
          console.error("Failed to delete file:", err);
          // 파일 삭제 실패해도 DB 레코드는 삭제 진행
        }
      }
    }

    // 과제 삭제
    await (prisma as unknown as {
      assignment: {
        delete: (args: {
          where: { id: string };
        }) => Promise<void>;
      };
    }).assignment.delete({
      where: { id: params.assignmentId },
    });

    return NextResponse.json(
      { message: "과제가 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete assignment error:", error);
    return NextResponse.json(
      { error: "과제 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

