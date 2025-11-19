import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluationQuestionPayloadSchema } from "./validation";

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json(
        { error: "평가 문항 생성 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 수업 소유권 확인
    const course = await prisma.course.findFirst({
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

    const body = await request.json();
    const validatedData = evaluationQuestionPayloadSchema.parse(body);

    // 문항들을 JSON 문자열로 변환
    const questionsJson = JSON.stringify(validatedData.questions);
    console.log("평가 문항 생성 요청:", {
      courseId: params.courseId,
      teacherId: session.user.id,
      unit: validatedData.unit,
      questionNumber: validatedData.questionNumber,
      questionsCount: validatedData.questions.length,
    });

    // 평가 문항 생성
    const evaluationQuestion = await prisma.evaluationQuestion.create({
      data: {
        unit: validatedData.unit,
        questionNumber: validatedData.questionNumber,
        questions: questionsJson,
        courseId: params.courseId,
        teacherId: session.user.id,
      },
    });

    console.log("평가 문항 생성 성공:", evaluationQuestion.id);

    return NextResponse.json(
      {
        message: "평가 문항이 생성되었습니다.",
        evaluationQuestion: {
          ...evaluationQuestion,
          questions: JSON.parse(evaluationQuestion.questions),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("평가 문항 생성 오류:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "입력 데이터가 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "평가 문항 생성 중 오류가 발생했습니다." },
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

    if (!session || session.user?.role !== "teacher") {
      return NextResponse.json(
        { error: "평가 문항 조회 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 수업 소유권 확인
    const course = await prisma.course.findFirst({
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

    // 평가 문항 목록 조회
    const evaluationQuestions = await prisma.evaluationQuestion.findMany({
      where: { courseId: params.courseId },
      orderBy: { createdAt: "desc" },
    });

    console.log(`평가 문항 조회: courseId=${params.courseId}, 개수=${evaluationQuestions.length}`);

    // JSON 문자열을 파싱하여 반환
    const parsedQuestions = evaluationQuestions.map((eq) => {
      try {
        return {
          ...eq,
          questions: JSON.parse(eq.questions),
        };
      } catch (parseError) {
        console.error("JSON 파싱 오류:", parseError, eq.questions);
        return {
          ...eq,
          questions: [],
        };
      }
    });

    return NextResponse.json({ evaluationQuestions: parsedQuestions }, { status: 200 });
  } catch (error) {
    console.error("평가 문항 조회 오류:", error);
    
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("오류 상세:", errorMessage);

    return NextResponse.json(
      { error: "평가 문항 조회 중 오류가 발생했습니다.", details: errorMessage },
      { status: 500 }
    );
  }
}

