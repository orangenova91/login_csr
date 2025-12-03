import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

export const dynamic = 'force-dynamic';

type CsvRow = {
  email?: string;
  name?: string;
  school?: string;
  role?: string;
  studentId?: string;
  grade?: string;
  className?: string;
};

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 파일 확인
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 제공되지 않았습니다." }, { status: 400 });
    }

    // CSV 파일 읽기
    const text = await file.text();
    let rows: CsvRow[];
    try {
      rows = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CsvRow[];
    } catch (parseError) {
      return NextResponse.json(
        { error: "CSV 파일 파싱에 실패했습니다. 파일 형식을 확인해주세요." },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV 파일에 데이터가 없습니다." }, { status: 400 });
    }

    // 데이터 검증 및 업데이트
    const errors: string[] = [];
    let updated = 0;
    let notFound = 0;

    const prismaAny = prisma as any;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNumber = i + 2; // 헤더 포함

      // 필수 필드 검증: email은 필수
      if (!row.email || !row.email.trim()) {
        errors.push(`줄 ${lineNumber}: 이메일이 필요합니다.`);
        continue;
      }

      const email = row.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`줄 ${lineNumber}: 유효하지 않은 이메일 형식입니다 (${email}).`);
        continue;
      }

      // 사용자 찾기
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: {
          studentProfile: true,
        },
      });

      if (!existingUser) {
        errors.push(`줄 ${lineNumber}: 이메일로 사용자를 찾을 수 없습니다 (${email}).`);
        notFound++;
        continue;
      }

      // 역할 검증
      const role = row.role?.trim() || null;
      if (role && !["student", "teacher", "admin"].includes(role)) {
        errors.push(`줄 ${lineNumber}: 유효하지 않은 역할입니다 (${role}).`);
        continue;
      }

      try {
        // 사용자 기본 정보 업데이트
        const updateData: any = {};
        if (row.name !== undefined) updateData.name = row.name?.trim() || null;
        if (row.school !== undefined) updateData.school = row.school?.trim() || null;
        if (row.role !== undefined) updateData.role = role || null;

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: updateData,
          });
        }

        // 학생 프로필 업데이트 (역할이 student인 경우)
        if (role === "student" || existingUser.role === "student") {
          const studentProfileData: any = {};

          if (row.studentId !== undefined) {
            studentProfileData.studentId = row.studentId?.trim() || null;
          }
          if (row.grade !== undefined) {
            studentProfileData.grade = row.grade?.trim() || null;
          }
          if (row.className !== undefined) {
            studentProfileData.classLabel = row.className?.trim() || null;
          }

          if (Object.keys(studentProfileData).length > 0) {
            if (existingUser.studentProfile) {
              // 기존 프로필 업데이트
              await prismaAny.studentProfile.update({
                where: { userId: existingUser.id },
                data: studentProfileData,
              });
            } else if (role === "student" || existingUser.role === "student") {
              // 새 프로필 생성 (학생 역할인 경우)
              await prismaAny.studentProfile.create({
                data: {
                  userId: existingUser.id,
                  ...studentProfileData,
                },
              });
            }
          }
        }

        updated++;
      } catch (updateError: any) {
        errors.push(`줄 ${lineNumber}: 업데이트 실패 (${email}): ${updateError.message}`);
      }
    }

    return NextResponse.json({
      message: "사용자 정보 업데이트가 완료되었습니다.",
      updated,
      notFound,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      {
        error: "사용자 정보 업데이트 중 오류가 발생했습니다.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

