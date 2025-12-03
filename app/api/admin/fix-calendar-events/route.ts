import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 데이터베이스의 eventType이 null인 CalendarEvent 레코드를 "기타"로 업데이트하는 API
 * 관리자만 접근 가능하도록 설정 (필요시 권한 체크 추가)
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // 보안: 관리자 또는 슈퍼어드민만 접근 가능하도록 체크
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // eventType이 null인 레코드 찾기
    const nullEvents = await prisma.calendarEvent.findMany({
      where: {
        eventType: null,
      },
      select: {
        id: true,
        title: true,
      },
    });

    // null 값을 "기타"로 업데이트
    const result = await prisma.calendarEvent.updateMany({
      where: {
        eventType: null,
      },
      data: {
        eventType: "기타",
      },
    });

    return NextResponse.json(
      {
        message: "데이터 정리가 완료되었습니다.",
        updatedCount: result.count,
        affectedEvents: nullEvents,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fix calendar events error:", error);
    return NextResponse.json(
      { error: "데이터 정리 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}

