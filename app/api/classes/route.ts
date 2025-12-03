import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createClassSchema = z.object({
  academicYear: z
    .string()
    .trim()
    .min(1, "학년도를 입력하세요")
    .max(9, "학년도가 너무 깁니다 (예: 2025)"),
  semester: z.string().trim().min(1, "학기를 선택하세요"),
  subjectGroup: z
    .string()
    .trim()
    .min(1, "교과군을 입력하세요")
    .max(50, "교과군은 50자 이하여야 합니다"),
  subjectArea: z
    .string()
    .trim()
    .min(1, "교과영역을 입력하세요")
    .max(50, "교과영역은 50자 이하여야 합니다"),
  careerTrack: z
    .string()
    .trim()
    .min(1, "진로구분을 입력하세요")
    .max(50, "진로구분은 50자 이하여야 합니다"),
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
  description: z
    .string()
    .trim()
    .min(1, "강의소개를 입력하세요")
    .max(1000, "강의소개는 1000자 이하여야 합니다"),
  instructor: z.string().trim().optional(),
});

export const dynamic = 'force-dynamic';

async function generateUniqueJoinCode() {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = randomBytes(3).toString("hex").toUpperCase();

    const existing = await prisma.course.findFirst({
      where: { joinCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("수업 코드를 생성할 수 없습니다. 잠시 후 다시 시도해주세요.");
}

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

    const joinCode = await generateUniqueJoinCode();

    const newClass = await prisma.course.create({
      data: {
        academicYear: data.academicYear,
        semester: data.semester,
        subjectGroup: data.subjectGroup,
        subjectArea: data.subjectArea,
        careerTrack: data.careerTrack,
        subject: data.subject,
        grade: data.grade,
        instructor: instructorName,
        classroom: data.classroom,
        description: data.description,
        joinCode,
        teacherId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: "수업이 생성되었습니다.",
        class: {
          id: newClass.id,
          academicYear: newClass.academicYear,
          semester: newClass.semester,
          subjectGroup: newClass.subjectGroup,
          subjectArea: newClass.subjectArea,
          careerTrack: newClass.careerTrack,
          subject: newClass.subject,
          grade: newClass.grade,
          instructor: newClass.instructor,
          classroom: newClass.classroom,
          description: newClass.description,
          joinCode: newClass.joinCode,
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

