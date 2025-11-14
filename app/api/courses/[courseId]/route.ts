import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateCourseSchema = z.object({
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json(
        { error: "수업 수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 수업 존재 여부 및 소유권 확인
    const course = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        teacherId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "수업을 찾을 수 없거나 수정 권한이 없습니다." },
        { status: 404 }
      );
    }

    const json = await request.json();
    const data = updateCourseSchema.parse(json);

    const instructorName =
      data.instructor && data.instructor.trim().length > 0
        ? data.instructor
        : session.user?.name && session.user.name.trim().length > 0
        ? session.user.name
        : session.user?.email ?? "이름 미기재";

    const updatedCourse = await prisma.course.update({
      where: { id: params.courseId },
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
      },
    });

    return NextResponse.json(
      {
        message: "수업 정보가 수정되었습니다.",
        course: {
          id: updatedCourse.id,
          academicYear: updatedCourse.academicYear,
          semester: updatedCourse.semester,
          subjectGroup: updatedCourse.subjectGroup,
          subjectArea: updatedCourse.subjectArea,
          careerTrack: updatedCourse.careerTrack,
          subject: updatedCourse.subject,
          grade: updatedCourse.grade,
          instructor: updatedCourse.instructor,
          classroom: updatedCourse.classroom,
          description: updatedCourse.description,
          joinCode: updatedCourse.joinCode,
          updatedAt: updatedCourse.updatedAt,
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

    console.error("Update course error:", error);
    return NextResponse.json(
      { error: "수업 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

