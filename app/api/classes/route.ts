import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createClassSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "교과명을 입력하세요")
    .max(50, "교과명은 50자 이하여야 합니다"),
  grade: z.string().trim().min(1, "대상 학년을 선택하세요"),
  classroom: z
    .string()
    .trim()
    .min(1, "강의실을 입력하세요")
    .max(50, "강의실은 50자 이하여야 합니다"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json(
        { error: "수업 생성 권한이 없습니다." },
        { status: 403 }
      );
    }

    const json = await request.json();
    const data = createClassSchema.parse(json);

    const instructorName =
      session.user?.name && session.user.name.trim().length > 0
        ? session.user.name
        : session.user?.email ?? "이름 미기재";

    const newClass = await prisma.course.create({
      data: {
        subject: data.subject,
        grade: data.grade,
        instructor: instructorName,
        classroom: data.classroom,
        teacherId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: "수업이 생성되었습니다.",
        class: {
          id: newClass.id,
          subject: newClass.subject,
          grade: newClass.grade,
          instructor: newClass.instructor,
          classroom: newClass.classroom,
          createdAt: newClass.createdAt,
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

    console.error("Create class error:", error);
    return NextResponse.json(
      { error: "수업 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

