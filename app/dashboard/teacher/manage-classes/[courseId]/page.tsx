import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CourseTabs from "@/components/dashboard/CourseTabs";
import StudentManager from "@/components/dashboard/StudentManager";
import SelectedStudentsTable from "@/components/dashboard/SelectedStudentsTable";
import AttendanceTable from "@/components/dashboard/AttendanceTable";
import AssignmentManager from "@/components/dashboard/AssignmentManager";
import StudentEvaluation from "@/components/dashboard/StudentEvaluation";
import CourseSettings from "@/components/dashboard/CourseSettings";

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
        academicYear: string;
        semester: string;
        subjectGroup: string;
        subjectArea: string;
        careerTrack: string;
        subject: string;
        grade: string;
        instructor: string;
        classroom: string;
        description: string;
        joinCode: string | null;
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

  const students =
    (await (prisma as any).user.findMany({
      where: { role: "student" },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
    })) ?? [];

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
  const infoChips = [
    course.academicYear?.trim()
      ? `${course.academicYear.trim()} 학년도`
      : null,
    course.semester?.trim() ? course.semester.trim() : null,
    course.grade?.trim()
      ? ` ${course.grade.trim()} 학년`
      : null,
  ].filter(Boolean) as string[];

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
      {infoChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {infoChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.subject}</h1>
            <p className="text-sm text-gray-600 mt-1">
              강사 {course.instructor} · 강의실 {course.classroom}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <span>수업 코드</span>
            <span className="font-mono tracking-wide text-sm">
              {course.joinCode ?? "미발급"}
            </span>
          </div>
        </div>
        
      </header>

      <section>
        <CourseTabs
          tabs={[
            { id: "overview", label: "수업 소개" },
            { id: "announcements", label: "공지사항" },
            { id: "attendance", label: "학생 출결" },
            { id: "assignments", label: "수업 과제" },
            { id: "notes", label: "학생 평가" },
            { id: "record", label: "생기부" },
            { id: "settings", label: "설정" },
          ]}
        >
          {[
            <article
              key="overview"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">수업 소개</h2>
              </header>
              <div className="space-y-6">
                {/* 기본 정보 섹션 */}
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">기본 정보</h3>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <dt className="text-sm font-medium text-gray-600 min-w-[80px]">학년도</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {course.academicYear?.trim() || (
                          <span className="text-gray-400">정보 없음</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start gap-3">
                      <dt className="text-sm font-medium text-gray-600 min-w-[80px]">학기</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {course.semester?.trim() || (
                          <span className="text-gray-400">정보 없음</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start gap-3">
                      <dt className="text-sm font-medium text-gray-600 min-w-[80px]">대상 학년</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {getGradeLabel(course.grade)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* 수업 정보 섹션 */}
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">수업 정보</h3>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <dt className="text-sm font-medium text-gray-600 min-w-[80px]">교과명</dt>
                      <dd className="text-sm font-semibold text-gray-900">{course.subject}</dd>
                    </div>
                    <div className="flex items-start gap-3">
                      <dt className="text-sm font-medium text-gray-600 min-w-[80px]">교과군</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {course.subjectGroup?.trim() || (
                          <span className="text-gray-400">정보 없음</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start gap-3">
                      <dt className="text-sm font-medium text-gray-600 min-w-[80px]">교과영역</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {course.subjectArea?.trim() || (
                          <span className="text-gray-400">정보 없음</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start gap-3">
                      <dt className="text-sm font-medium text-gray-600 min-w-[80px]">진로구분</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {course.careerTrack?.trim() || (
                          <span className="text-gray-400">정보 없음</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* 담당 정보 섹션 */}
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">담당 정보</h3>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <dt className="text-sm font-medium text-gray-600 min-w-[80px]">강사명</dt>
                      <dd className="text-sm font-medium text-gray-900">{course.instructor}</dd>
                    </div>
                    <div className="flex items-start gap-3">
                      <dt className="text-sm font-medium text-gray-600 min-w-[80px]">강의실</dt>
                      <dd className="text-sm font-medium text-gray-900">{course.classroom}</dd>
                    </div>
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-600 min-w-[80px]">수업 코드</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {course.joinCode ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 font-mono text-sm font-semibold text-indigo-700 border border-indigo-200 shadow-sm">
                            {course.joinCode}
                          </span>
                        ) : (
                          <span className="text-gray-400">미발급</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* 강의소개 섹션 */}
                {course.description?.trim() && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">강의소개</h3>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-white rounded-md p-4 border border-gray-200">
                      {course.description}
                    </div>
                  </div>
                )}
              </div>
            </article>,
            <article
              key="announcements"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">공지사항</h2>
              </header>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>공지사항 내용이 여기에 표시됩니다.</p>
                </div>
              </div>
            </article>,
            <article
              key="attendance"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">학생 출결</h2>
              </header>           <StudentManager courseId={course.id} students={students} />
              {/* <SelectedStudentsTable courseId={course.id} students={students} /> */}
              <AttendanceTable courseId={course.id} students={students} />
            </article>,
            <article
              key="assignments"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">수업 과제</h2>
              </header>
              <AssignmentManager courseId={course.id} />
            </article>,
            <article
              key="notes"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">학생 평가</h2>
              </header>
              <StudentEvaluation courseId={course.id} />
            </article>,
            <article
              key="record"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">생기부</h2>
              </header>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>생기부 내용이 여기에 표시됩니다.</p>
                </div>
              </div>
            </article>,
            <article
              key="settings"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">설정</h2>
              </header>
              <div className="space-y-6">
                <div className="text-sm text-gray-600">
                  <p>수업과 관련된 위험 작업을 관리합니다.</p>
                </div>
                <CourseSettings courseId={course.id} courseName={course.subject} />
              </div>
            </article>,
          ]}
        </CourseTabs>
      </section>
    </div>
  );
}

