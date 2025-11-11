import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CourseTabs from "@/components/dashboard/CourseTabs";

interface ManageClassDetailPageProps {
  params: {
    courseId: string;
  };
}

export default async function ManageClassDetailPage({
  params,
}: ManageClassDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  const course = await (prisma as unknown as {
    course: {
      findFirst: (args: {
        where: { id: string; teacherId: string };
      }) => Promise<{
        id: string;
        subject: string;
        grade: string | null;
        instructor: string;
        classroom: string;
        createdAt: Date;
        updatedAt: Date;
      } | null>;
    };
  }).course.findFirst({
    where: {
      id: params.courseId,
      teacherId: session.user.id,
    },
  });

  if (!course) {
    notFound();
  }

  const getGradeLabel = (grade: string | null) => {
    switch (grade) {
      case "1":
        return "1학년";
      case "2":
        return "2학년";
      case "3":
        return "3학년";
      default:
        return grade ?? "학년 정보 없음";
    }
  };

  const createdAt = new Date(course.createdAt).toLocaleString("ko-KR");
  const updatedAt = new Date(course.updatedAt).toLocaleString("ko-KR");

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link
              href="/dashboard/teacher/manage-classes"
              className="hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md px-1"
            >
              내 수업 목록
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-700 font-medium truncate">
            {course.subject}
          </li>
        </ol>
      </nav>

      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.subject}</h1>
            <p className="text-sm text-gray-600 mt-1">
              강사 {course.instructor} · 강의실 {course.classroom}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {getGradeLabel(course.grade)}
          </div>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 text-sm text-gray-600">
          <div>
            <dt className="font-medium text-gray-500">생성일</dt>
            <dd>{createdAt}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">최근 업데이트</dt>
            <dd>{updatedAt}</dd>
          </div>
        </dl>
      </header>

      <section>
        <CourseTabs
          tabs={[
            { id: "attendance", label: "학생 출결 관리" },
            { id: "assignments", label: "수업 과제 관리" },
            { id: "notes", label: "수업 노트" },
          ]}
        >
          {[
            <article
              key="attendance"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">학생 출결 관리</h2>
                <span className="text-xs font-medium text-gray-500">예정 기능</span>
              </header>
              <p className="text-sm text-gray-600">
                출석부, 결석 사유 기록, 지각/조퇴 현황 등을 추적할 수 있도록 구성합니다.
              </p>
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                TODO: 출결 현황 차트, 학생 목록 테이블, 출결 기록 입력 폼 등
              </div>
            </article>,
            <article
              key="assignments"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">수업 과제 관리</h2>
                <span className="text-xs font-medium text-gray-500">예정 기능</span>
              </header>
              <p className="text-sm text-gray-600">
                과제를 생성하고 제출 파일을 확인하며 피드백을 남길 수 있는 공간을 구성할 예정입니다.
              </p>
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                TODO: 과제 등록 폼, 제출 현황, 피드백 기록 등
              </div>
            </article>,
            <article
              key="notes"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">수업 노트 & 커뮤니케이션</h2>
                <span className="text-xs font-medium text-gray-500">예정 기능</span>
              </header>
              <p className="text-sm text-gray-600">
                수업 기록, 공지사항, 학생/보호자와의 소통을 위한 기능을 확장할 수 있습니다.
              </p>
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                TODO: 노트 작성, 공지 발행, 메시지 로그 등
              </div>
            </article>,
          ]}
        </CourseTabs>
      </section>
    </div>
  );
}

