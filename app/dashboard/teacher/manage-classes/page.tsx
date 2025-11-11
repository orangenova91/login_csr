import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import CreateClassPopupButton from "@/components/dashboard/CreateClassPopupButton";

export default async function ManageClassesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  const t = getTranslations("ko");
  const copy = t.dashboard.teacherSections.manageClasses;
  const instructorName = session.user.name ?? session.user.email ?? "";
  const teacherId = session.user.id;

  type TeacherCourse = {
    id: string;
    subject: string;
    grade: string;
    instructor: string;
    classroom: string;
    createdAt: Date;
  };

  const classes: TeacherCourse[] = teacherId
    ? await (
        prisma as unknown as {
          course: {
            findMany: (args: {
              where: { teacherId: string };
              orderBy: { createdAt: "desc" };
            }) => Promise<TeacherCourse[]>;
          };
        }
      ).course.findMany({
        where: { teacherId },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const formatGrade = (grade: string) => {
    switch (grade) {
      case "1":
        return "1학년";
      case "2":
        return "2학년";
      case "3":
        return "3학년";
      default:
        return grade;
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <CreateClassPopupButton instructorName={instructorName} />
      </div>
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
          <p className="mt-2 text-sm text-gray-600">{copy.description}</p>
        </header>
      </div>
      <section className="space-y-4">
          <div className="rounded-lg border border-gray-100 p-4">
            <h2 className="text-lg font-semibold text-gray-900">내 수업 목록</h2>
            {classes.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">
                아직 생성된 수업이 없습니다. 상단의 ‘수업 생성’ 버튼을 눌러 첫 수업을 만들어 보세요.
              </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {classes.map((course) => (
                    <Link
                      key={course.id}
                      href={`/dashboard/teacher/manage-classes/${course.id}`}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-between transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      <article className="flex h-full flex-col justify-between">
                        <header>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {course.subject}
                          </h3>
                          <span className="mt-2 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {formatGrade(course.grade)}
                          </span>
                        </header>
                        <dl className="space-y-1 text-sm text-gray-600 mt-4 mb-4 flex-1">
                          <div className="flex items-center gap-2">
                            <dt className="font-medium text-gray-500">강사</dt>
                            <dd>{course.instructor}</dd>
                          </div>
                          <div className="flex items-center gap-2">
                            <dt className="font-medium text-gray-500">강의실</dt>
                            <dd>{course.classroom}</dd>
                          </div>
                        </dl>
                        <footer className="text-xs text-gray-400">
                          생성일 · {course.createdAt.toLocaleString("ko-KR")}
                        </footer>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
          </div>
        </section>
    </div>
  );
}

