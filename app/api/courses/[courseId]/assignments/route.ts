import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createAssignmentSchema = z.object({
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

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json(
        { error: "과제 생성 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 수업 소유권 확인
    const course = await (prisma as unknown as {
      course: {
        findFirst: (args: {
          where: { id: string; teacherId: string };
        }) => Promise<{ id: string } | null>;
      };
    }).course.findFirst({
      where: {
        id: params.courseId,
        teacherId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "수업을 찾을 수 없거나 권한이 없습니다." },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const dueDateStr = formData.get("dueDate") as string | null;
    const file = formData.get("file") as File | null;

    // 데이터 검증
    const validatedData = createAssignmentSchema.parse({
      title,
      description: description || undefined,
      dueDate: dueDateStr || undefined,
    });

    let filePath: string | null = null;
    let originalFileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;

    // 파일 처리 (선택적)
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

      // 파일 저장
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

    // 과제 생성
    const assignment = await (prisma as unknown as {
      assignment: {
        create: (args: {
          data: {
            title: string;
            description: string | null;
            filePath: string | null;
            originalFileName: string | null;
            fileSize: number | null;
            mimeType: string | null;
            dueDate: Date | null;
            courseId: string;
            teacherId: string;
          };
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
    }).assignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        filePath,
        originalFileName,
        fileSize,
        mimeType,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        courseId: params.courseId,
        teacherId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: "과제가 생성되었습니다.",
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
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create assignment error:", error);
    return NextResponse.json(
      { error: "과제 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 수업 소유권 확인 (교사만)
    const course = await (prisma as unknown as {
      course: {
        findFirst: (args: {
          where: { id: string; teacherId?: string };
        }) => Promise<{ id: string } | null>;
      };
    }).course.findFirst({
      where: {
        id: params.courseId,
        ...(session.user?.role === "teacher" ? { teacherId: session.user.id } : {}),
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "수업을 찾을 수 없거나 권한이 없습니다." },
        { status: 404 }
      );
    }

    const assignments = await (prisma as unknown as {
      assignment: {
        findMany: (args: {
          where: { courseId: string };
          orderBy: { createdAt: "desc" };
        }) => Promise<
          Array<{
            id: string;
            title: string;
            description: string | null;
            filePath: string | null;
            originalFileName: string | null;
            fileSize: number | null;
            mimeType: string | null;
            dueDate: Date | null;
            createdAt: Date;
            updatedAt: Date;
          }>
        >;
      };
    }).assignment.findMany({
      where: { courseId: params.courseId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        filePath: a.filePath,
        originalFileName: a.originalFileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        dueDate: a.dueDate?.toISOString() || null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    return NextResponse.json(
      { error: "과제 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

