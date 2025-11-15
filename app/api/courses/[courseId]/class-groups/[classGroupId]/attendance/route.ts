import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const saveAttendanceSchema = z.object({
  date: z.string().datetime(), // ISO 8601 형식의 날짜 문자열
  attendances: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum([
        "present",
        "late",
        "sick_leave",
        "approved_absence",
        "excused",
      ]),
    })
  ),
});

// 출결 저장
export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: { courseId: string; classGroupId: string };
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json(
        { error: "출결 저장 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 학반 존재 여부 및 소유권 확인
    const classGroup = await prisma.classGroup.findFirst({
      where: {
        id: params.classGroupId,
        courseId: params.courseId,
        teacherId: session.user.id,
      },
      include: {
        course: true,
      },
    });

    if (!classGroup) {
      return NextResponse.json(
        { error: "학반을 찾을 수 없거나 저장 권한이 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = saveAttendanceSchema.parse(body);

    const attendanceDate = new Date(validatedData.date);

    // 출결 데이터 저장 (upsert 사용: 있으면 업데이트, 없으면 생성)
    const results = await Promise.all(
      validatedData.attendances.map(async (attendance) => {
        return await (prisma as any).attendance.upsert({
          where: {
            classGroupId_studentId_date: {
              classGroupId: params.classGroupId,
              studentId: attendance.studentId,
              date: attendanceDate,
            },
          },
          update: {
            status: attendance.status,
            updatedAt: new Date(),
          },
          create: {
            classGroupId: params.classGroupId,
            studentId: attendance.studentId,
            date: attendanceDate,
            status: attendance.status,
            teacherId: session.user.id,
          },
        });
      })
    );

    return NextResponse.json(
      {
        message: "출결이 성공적으로 저장되었습니다.",
        count: results.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("출결 저장 오류:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "입력 데이터가 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "출결 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 특정 날짜의 출결 조회
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { courseId: string; classGroupId: string };
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json(
        { error: "출결 조회 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 학반 존재 여부 및 소유권 확인
    const classGroup = await prisma.classGroup.findFirst({
      where: {
        id: params.classGroupId,
        courseId: params.courseId,
        teacherId: session.user.id,
      },
    });

    if (!classGroup) {
      return NextResponse.json(
        { error: "학반을 찾을 수 없거나 조회 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 쿼리 파라미터에서 날짜 가져오기
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "날짜 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(dateParam);

    // 해당 날짜의 출결 조회
    const attendances = await (prisma as any).attendance.findMany({
      where: {
        classGroupId: params.classGroupId,
        date: attendanceDate,
      },
    });

    return NextResponse.json(
      { attendances },
      { status: 200 }
    );
  } catch (error) {
    console.error("출결 조회 오류:", error);
    return NextResponse.json(
      { error: "출결 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

