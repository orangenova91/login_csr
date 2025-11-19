import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { parse } from "csv-parse/sync";

type CsvRow = {
  email?: string;
  name?: string;
  school?: string;
  role?: string;
  password?: string;
};

const DEFAULT_PASSWORD = "Abcd1234!@";

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

    // 데이터 검증 및 변환
    const errors: string[] = [];
    const validUsers: Array<{
      email: string;
      hashedPassword: string;
      name: string | null;
      school: string | null;
      role: string | null;
      emailVerified: Date;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNumber = i + 2; // 헤더 포함

      // 필수 필드 검증
      if (!row.email || !row.email.trim()) {
        errors.push(`줄 ${lineNumber}: 이메일이 필요합니다.`);
        continue;
      }

      const email = row.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`줄 ${lineNumber}: 유효하지 않은 이메일 형식입니다 (${email}).`);
        continue;
      }

      // 역할 검증
      const role = row.role?.trim() || null;
      if (role && !["student", "teacher", "admin"].includes(role)) {
        errors.push(`줄 ${lineNumber}: 유효하지 않은 역할입니다 (${role}).`);
        continue;
      }

      // 비밀번호 처리
      const password = row.password?.trim() || DEFAULT_PASSWORD;
      if (password.length < 8) {
        errors.push(`줄 ${lineNumber}: 비밀번호는 최소 8자 이상이어야 합니다.`);
        continue;
      }

      const hashedPassword = await hashPassword(password);

      validUsers.push({
        email,
        hashedPassword,
        name: row.name?.trim() || null,
        school: row.school?.trim() || null,
        role,
        emailVerified: new Date(), // 이메일 인증 없이 바로 활성화
      });
    }

    if (validUsers.length === 0) {
      return NextResponse.json(
        {
          error: "유효한 사용자 데이터가 없습니다.",
          errors,
        },
        { status: 400 }
      );
    }

    // 중복 이메일 확인
    const emails = validUsers.map((u) => u.email);
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    const existingEmails = new Set(existingUsers.map((u) => u.email));

    // 중복 제외
    const toInsert = validUsers.filter((u) => !existingEmails.has(u.email));
    const skipped = validUsers.length - toInsert.length;

    // 사용자 생성
    let created = 0;
    const CHUNK_SIZE = 100;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      try {
        await prisma.user.createMany({
          data: chunk,
          skipDuplicates: true, // MongoDB에서는 작동하지 않을 수 있지만 안전장치
        });
        created += chunk.length;
      } catch (chunkError) {
        // 개별 생성으로 폴백
        for (const user of chunk) {
          try {
            await prisma.user.create({ data: user });
            created += 1;
          } catch (individualError: any) {
            if (individualError.code !== "P2002") {
              // 중복이 아닌 다른 오류
              errors.push(`사용자 생성 실패 (${user.email}): ${individualError.message}`);
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: "사용자 등록이 완료되었습니다.",
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      {
        error: "사용자 등록 중 오류가 발생했습니다.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

