import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SuperAdminDashboard } from "@/components/dashboard/superadmin/SuperAdminDashboard";

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  // Admin 계정 목록 및 학교 정보 가져오기
  const [admins, schools, stats] = await Promise.all([
    prisma.user.findMany({
      where: { role: "admin" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        school: true,
        createdAt: true,
        adminProfile: {
          select: {
            phoneNumber: true,
            notes: true,
            school: {
              select: {
                id: true,
                name: true,
                schoolType: true,
                contactName: true,
                contactPhone: true,
                gradeInfo: true,
                totalClasses: true,
                totalStudents: true,
                status: true,
                notes: true,
                createdAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        schoolType: true,
        adminUserId: true,
        createdBy: true,
        contactName: true,
        contactPhone: true,
        gradeInfo: true,
        totalClasses: true,
        totalStudents: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.$transaction([
      prisma.user.count({ where: { role: "admin" } }),
      prisma.school.count({ where: { status: "active" } }),
      prisma.user.count({ where: { role: "teacher" } }),
      prisma.user.count({ where: { role: "student" } }),
    ]),
  ]);

  const [adminCount, schoolCount, teacherCount, studentCount] = stats;

  return (
    <SuperAdminDashboard
      admins={admins}
      schools={schools}
      stats={{
        adminCount,
        schoolCount,
        teacherCount,
        studentCount,
      }}
    />
  );
}

