import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

const t = getTranslations("ko");

const todaysSchedule = [
  {
    title: "국어 수업",
    time: "08:30 - 09:20",
    location: "1-2 교실",
  },
  {
    title: "수학 자율 학습",
    time: "15:30 - 16:10",
    location: "도서관",
  },
];

const assignments = [
  {
    title: "역사 독후감 제출",
    due: "11월 12일 (화)",
  },
  {
    title: "수학 문제집 5단원",
    due: "11월 13일 (수)",
  },
];

const announcements = [
  {
    title: "동아리 박람회 안내",
    date: "2025-11-15",
  },
  {
    title: "모의고사 일정 안내",
    date: "2025-11-20",
  },
];

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "student") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <header className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t.dashboard.studentTitle}
        </h2>
        <p className="text-gray-600">{t.dashboard.studentDescription}</p>
        <div className="mt-6 bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-800">
          {session.user.school
            ? `${session.user.school} · ${t.dashboard.roleStudent}`
            : t.dashboard.roleStudent}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {t.dashboard.studentScheduleTitle}
          </h3>
          <ul className="mt-4 space-y-3">
            {todaysSchedule.length === 0 ? (
              <li className="text-sm text-gray-600">
                {t.dashboard.studentScheduleEmpty}
              </li>
            ) : (
              todaysSchedule.map((item) => (
                <li
                  key={item.title}
                  className="flex flex-col rounded-lg border border-gray-100 p-4"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {item.title}
                  </span>
                  <span className="text-sm text-gray-600 mt-1">{item.time}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {item.location}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            {t.dashboard.studentAssignmentsTitle}
          </h3>
          <ul className="mt-4 space-y-3">
            {assignments.length === 0 ? (
              <li className="text-sm text-gray-600">
                {t.dashboard.studentAssignmentsEmpty}
              </li>
            ) : (
              assignments.map((assignment) => (
                <li
                  key={assignment.title}
                  className="rounded-lg border border-gray-100 p-4"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {assignment.title}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {assignment.due}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          {t.dashboard.studentAnnouncementsTitle}
        </h3>
        <ul className="mt-4 space-y-3">
          {announcements.map((announcement) => (
            <li
              key={announcement.title}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
            >
              <span className="text-sm font-medium text-gray-900">
                {announcement.title}
              </span>
              <span className="text-xs text-gray-500">{announcement.date}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

