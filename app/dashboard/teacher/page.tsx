import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

const t = getTranslations("ko");

const teacherSections = [
  {
    key: "manageClasses",
    title: t.dashboard.teacherSections.manageClasses.title,
    description: t.dashboard.teacherSections.manageClasses.description,
    action: t.dashboard.teacherSections.manageClasses.action,
  },
  {
    key: "studentProgress",
    title: t.dashboard.teacherSections.studentProgress.title,
    description: t.dashboard.teacherSections.studentProgress.description,
    action: t.dashboard.teacherSections.studentProgress.action,
  },
  {
    key: "announcements",
    title: t.dashboard.teacherSections.announcements.title,
    description: t.dashboard.teacherSections.announcements.description,
    action: t.dashboard.teacherSections.announcements.action,
  },
];

const upcomingLessons = [
  {
    title: "2학년 과학 실험 수업",
    time: "11월 11일 (월) 09:00",
    location: "과학실 2",
  },
  {
    title: "3학년 진로 상담",
    time: "11월 12일 (화) 13:30",
    location: "상담실",
  },
];

const quickNotes = [
  {
    title: "1학년 기말고사 공지",
    date: "2025-11-15",
  },
  {
    title: "교원 협의회",
    date: "2025-11-18",
  },
];

export default async function TeacherDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <header className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t.dashboard.teacherTitle}
        </h2>
        <p className="text-gray-600">{t.dashboard.teacherDescription}</p>
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          {session.user.school
            ? `${session.user.school} · ${t.dashboard.roleTeacher}`
            : t.dashboard.roleTeacher}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teacherSections.map((section) => (
          <article
            key={section.key}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{section.description}</p>
            <button
              type="button"
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {section.action}
            </button>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            {t.dashboard.teacherScheduleTitle}
          </h3>
          <ul className="mt-4 space-y-3">
            {upcomingLessons.length === 0 ? (
              <li className="text-sm text-gray-600">
                {t.dashboard.teacherScheduleEmpty}
              </li>
            ) : (
              upcomingLessons.map((lesson) => (
                <li
                  key={lesson.title}
                  className="flex flex-col rounded-lg border border-gray-100 p-4"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {lesson.title}
                  </span>
                  <span className="text-sm text-gray-600 mt-1">{lesson.time}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {lesson.location}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            {t.dashboard.teacherSections.announcements.title}
          </h3>
          <ul className="mt-4 space-y-3">
            {quickNotes.map((note) => (
              <li
                key={note.title}
                className="flex flex-col rounded-lg border border-gray-100 p-4"
              >
                <span className="text-sm font-medium text-gray-900">
                  {note.title}
                </span>
                <span className="text-xs text-gray-500 mt-1">{note.date}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

