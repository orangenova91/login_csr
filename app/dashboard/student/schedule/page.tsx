import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

const schedule = [
  {
    title: "영어 회화",
    time: "08:30 - 09:20",
    location: "2-3 교실",
  },
  {
    title: "체육",
    time: "10:30 - 11:20",
    location: "체육관",
  },
  {
    title: "동아리 활동",
    time: "15:40 - 16:30",
    location: "동아리실",
  },
];

export default async function StudentSchedulePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "student") {
    redirect("/dashboard");
  }

  const t = getTranslations("ko");

  return (
    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.studentScheduleTitle}</h1>
        <p className="mt-2 text-sm text-gray-600">
          오늘 예정된 수업과 활동 일정을 확인하세요.
        </p>
      </header>

      <section className="rounded-lg border border-gray-100 p-4">
        <ul className="space-y-3 text-sm text-gray-700">
          {schedule.length === 0 ? (
            <li>{t.dashboard.studentScheduleEmpty}</li>
          ) : (
            schedule.map((item) => (
              <li key={item.title} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{item.title}</span>
                  <span className="text-xs text-gray-500">{item.time}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{item.location}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

