import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

const upcomingEvents = [
  {
    title: "2학년 과학 시험",
    date: "2025-11-14",
    type: "평가",
  },
  {
    title: "교원 연수",
    date: "2025-11-20",
    type: "행사",
  },
];

export default async function TeacherSchedulePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  const t = getTranslations("ko");

  return (
    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.teacherScheduleTitle}</h1>
        <p className="mt-2 text-sm text-gray-600">
          개인 일정과 학교 공통 일정을 함께 확인하고 관리할 수 있습니다.
        </p>
      </header>

      <section className="rounded-lg border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-900">다가오는 일정</h2>
        <ul className="mt-3 space-y-3 text-sm text-gray-700">
          {upcomingEvents.length === 0 ? (
            <li>{t.dashboard.teacherScheduleEmpty}</li>
          ) : (
            upcomingEvents.map((event) => (
              <li key={event.title} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{event.title}</span>
                  <span className="text-xs text-gray-500">{event.date}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{event.type}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

