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
  [key: string]: string | undefined;
};

type Stats = {
  processed: number;
  studentRows: number;
  missingEmail: number;
  missingUser: number;
  created: number;
  updated: number;
};

const ELECTIVE_COLUMNS = [
  "Elective Subject (A)",
  "Elective Subject (B)",
  "Elective Subject (C)",
  "Elective Subject (D)",
  "Elective Subject (E)",
  "Elective Subject (F)",
] as const;

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
  if (cleaned.includes("학생")) return "student";
  if (cleaned.includes("교사")) return "teacher";
  return cleaned;
};

const buildElectives = (row: CsvRow) =>
  ELECTIVE_COLUMNS.map((key) => clean(row[key])).filter(
    (subject): subject is string => Boolean(subject),
  );

async function main() {
  const stats: Stats = {
    processed: 0,
    studentRows: 0,
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

    if (!clean(row.role)?.includes("학생")) {
      continue;
    }
    stats.studentRows += 1;

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
      studentId: clean(row.strudent_id),
      school,
      grade: clean(row.grade),
      classLabel: clean(row.class),
      section: clean(row.section),
      seatNumber: clean(row.seat_number),
      major: clean(row.major),
      sex: clean(row.sex),
      classOfficer: clean(row.class_officer),
      specialEducation: clean(row.special_edu_student),
      phoneNumber: clean(row.ph_number_me),
      siblings: clean(row.siblings),
      academicStatus: clean(row.academic_status),
      remarks: clean(row.remarks),
      club: clean(row.club),
      clubTeacher: clean(row.club_teacher),
      clubLocation: clean(row.club_location),
      dateOfBirth: clean(row.date_of_birth),
      address: clean(row.address),
      residentRegistrationNumber: clean(row.resident_registration_numbder),
      motherName: clean(row.name_mother),
      motherPhone: clean(row.ph_number_mother),
      motherRemarks: clean(row.remarks_mother),
      fatherName: clean(row.name_farther),
      fatherPhone: clean(row.ph_number_farther),
      fatherRemarks: clean(row.remarks_farther),
      electiveSubjects: buildElectives(row),
    };

    const result = await prisma.studentProfile.upsert({
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
    `Processed ${stats.processed} rows / ${stats.studentRows} 학생 행. ` +
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

