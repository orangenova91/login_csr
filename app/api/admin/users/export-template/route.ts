import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 관리자의 학교 정보 가져오기
    const adminSchool = session.user.school;

    // superadmin인 경우 모든 사용자, admin인 경우 같은 학교의 사용자만
    const userWhereCondition = session.user.role === "superadmin" 
      ? undefined 
      : adminSchool 
      ? { school: adminSchool }
      : { school: null }; // 학교 정보가 없는 경우 빈 결과

    const prismaAny = prisma as any;

    // 먼저 사용자 목록 가져오기
    const users = await prisma.user.findMany({
      where: userWhereCondition,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        school: true,
        role: true,
      },
    });

    // 해당 사용자들의 studentProfile 가져오기
    const userIds = users.map((user) => user.id);
    const studentProfiles = userIds.length > 0
      ? await prismaAny.studentProfile.findMany({
          where: {
            userId: { in: userIds },
          },
          select: {
            userId: true,
            grade: true,
            classLabel: true,
            studentId: true,
          },
        })
      : [];

    // 학생 프로필 맵 생성
    const studentProfileMap = new Map(
      studentProfiles.map((profile: any) => [profile.userId, profile])
    );

    // CSV 헤더
    const headers = ["email", "name", "school", "role", "studentId", "grade", "className"];

    // CSV 데이터 생성
    const csvRows = users.map((user) => {
      const studentProfile = studentProfileMap.get(user.id);
      return [
        user.email || "",
        user.name || "",
        user.school || "",
        user.role || "",
        user.role === "student" && studentProfile?.studentId ? studentProfile.studentId : "",
        user.role === "student" && studentProfile?.grade ? studentProfile.grade : "",
        user.role === "student" && studentProfile?.classLabel ? studentProfile.classLabel : "",
      ];
    });

    // CSV 형식으로 변환
    const escapeCsvValue = (value: string | null | undefined) => {
      const str = value?.toString() || "";
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    // BOM 추가 (한글 깨짐 방지)
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    // Response 반환
    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": 'attachment; filename="users_update_template.csv"',
      },
    });
  } catch (error: any) {
    console.error("Export template error:", error);
    return NextResponse.json(
      {
        error: "템플릿 다운로드 중 오류가 발생했습니다.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

