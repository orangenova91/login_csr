import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateStudentProfileSchema } from "@/lib/validations/student";

// GET: 현재 로그인한 학생의 프로필 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "학생만 접근할 수 있습니다." },
        { status: 403 }
      );
    }

    // User와 StudentProfile 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        school: user.school,
        region: user.region,
        role: user.role,
      },
      profile: user.studentProfile,
    });
  } catch (error) {
    console.error("Get student profile error:", error);
    return NextResponse.json(
      { error: "프로필 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 현재 로그인한 학생의 프로필 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "학생만 접근할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateStudentProfileSchema.parse(body);

    // User 업데이트할 데이터 준비
    const userUpdateData: {
      name?: string;
      school?: string;
      region?: string | null;
    } = {};

    if (validatedData.name !== undefined) {
      userUpdateData.name = validatedData.name;
    }
    if (validatedData.school !== undefined) {
      userUpdateData.school = validatedData.school;
    }
    if (validatedData.region !== undefined) {
      userUpdateData.region = validatedData.region;
    }

    // StudentProfile 업데이트할 데이터 준비
    const profileUpdateData: any = {};
    
    // 모든 필드를 체크하여 undefined가 아닌 경우에만 업데이트
    const profileFields = [
      "studentId", "grade", "classLabel", "section", "seatNumber",
      "major", "sex", "classOfficer", "specialEducation", "phoneNumber",
      "siblings", "academicStatus", "remarks", "club", "clubTeacher",
      "clubLocation", "dateOfBirth", "address", "residentRegistrationNumber",
      "motherName", "motherPhone", "motherRemarks",
      "fatherName", "fatherPhone", "fatherRemarks", "electiveSubjects"
    ];

    profileFields.forEach((field) => {
      if (validatedData[field as keyof typeof validatedData] !== undefined) {
        profileUpdateData[field] = validatedData[field as keyof typeof validatedData];
      }
    });

    // 트랜잭션으로 User와 StudentProfile 업데이트
    const result = await prisma.$transaction(async (tx) => {
      // User 업데이트
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: userUpdateData,
        });
      }

      // StudentProfile 업데이트 또는 생성
      const existingProfile = await tx.studentProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (existingProfile) {
        // 기존 프로필 업데이트
        if (Object.keys(profileUpdateData).length > 0) {
          await tx.studentProfile.update({
            where: { userId: session.user.id },
            data: profileUpdateData,
          });
        }
      } else {
        // 새 프로필 생성
        await tx.studentProfile.create({
          data: {
            userId: session.user.id,
            ...profileUpdateData,
          },
        });
      }

      // 업데이트된 데이터 반환
      return await tx.user.findUnique({
        where: { id: session.user.id },
        include: {
          studentProfile: true,
        },
      });
    });

    return NextResponse.json({
      message: "프로필이 성공적으로 업데이트되었습니다.",
      user: {
        id: result!.id,
        email: result!.email,
        name: result!.name,
        school: result!.school,
        region: result!.region,
        role: result!.role,
      },
      profile: result!.studentProfile,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update student profile error:", error);
    return NextResponse.json(
      { error: "프로필 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

