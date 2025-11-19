import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";

type CsvRow = {
  _id?: string;
  school?: string;
  role?: string;
  major?: string;
  class?: string;
  grade?: string;
  section?: string;
  seat_number?: string;
  strudent_id?: string;
  name?: string;
  sex?: string;
  email?: string;
  class_officer?: string;
  special_edu_student?: string;
  ph_number_me?: string;
  siblings?: string;
  academic_status?: string;
  remarks?: string;
  club?: string;
  club_teacher?: string;
  club_location?: string;
  date_of_birth?: string;
  address?: string;
  resident_registration_numbder?: string;
  name_mother?: string;
  ph_number_mother?: string;
  remarks_mother?: string;
  name_farther?: string;
  ph_number_farther?: string;
  remarks_farther?: string;
};

type Stats = {
  processed: number;
  teacherRows: number;
  missingEmail: number;
  missingUser: number;
  created: number;
  updated: number;
};

const prisma = new PrismaClient();

const clean = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length ? trimmed : null;
};

const normalizeEmail = (value?: string | null) => {
  const cleaned = clean(value);
  return cleaned ? cleaned.toLowerCase() : null;
};

const normalizeRole = (value?: string | null) => {
  const cleaned = clean(value);
  if (!cleaned) return null;
  if (cleaned.includes("교장") || cleaned.includes("교감")) return "teacher";
  if (cleaned.includes("교사")) return "teacher";
  if (cleaned.includes("행정")) return "staff";
  return cleaned;
};

const isTeacherLikeRow = (value?: string | null) => {
  const cleaned = clean(value);
  if (!cleaned) return false;
  const keywords = ["교사", "교장", "교감"];
  return keywords.some((keyword) => cleaned.includes(keyword));
};

async function main() {
  const stats: Stats = {
    processed: 0,
    teacherRows: 0,
    missingEmail: 0,
    missingUser: 0,
    created: 0,
    updated: 0,
  };

  const csvFile = path.resolve(__dirname, "./user_Schoolhub2025.csv");
  const content = fs.readFileSync(csvFile, "utf-8");
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  for (const row of rows) {
    stats.processed += 1;

    if (!isTeacherLikeRow(row.role)) {
      continue;
    }
    stats.teacherRows += 1;

    const email = normalizeEmail(row.email);
    if (!email) {
      stats.missingEmail += 1;
      continue;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      stats.missingUser += 1;
      console.warn(`[SKIP] 사용자 없음: ${email}`);
      continue;
    }

    const userUpdate: Record<string, string | null> = {};
    const normalizedRole = normalizeRole(row.role);
    const name = clean(row.name);
    const school = clean(row.school);

    if (name && name !== user.name) {
      userUpdate.name = name;
    }
    if (school && school !== user.school) {
      userUpdate.school = school;
    }
    if (normalizedRole && normalizedRole !== user.role) {
      userUpdate.role = normalizedRole;
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: userUpdate,
      });
    }

    const profileData = {
      school,
      roleLabel: clean(row.role),
      major: clean(row.major),
      classLabel: clean(row.class),
      grade: clean(row.grade),
      section: clean(row.section),
      phoneNumber: clean(row.ph_number_me),
      remarks: clean(row.remarks),
      club: clean(row.club),
      clubLocation: clean(row.club_location),
      dateOfBirth: clean(row.date_of_birth),
      address: clean(row.address),
    };

    const result = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...profileData,
      },
      update: profileData,
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      stats.created += 1;
    } else {
      stats.updated += 1;
    }
  }

  console.log(
    `Processed ${stats.processed} rows / ${stats.teacherRows} 교직원 행. ` +
      `생성 ${stats.created}, 업데이트 ${stats.updated}, 이메일 없음 ${stats.missingEmail}, 사용자 없음 ${stats.missingUser}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

