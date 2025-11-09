import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

const announcements = [
  {
    title: "11월 학부모 상담 일정",
    date: "2025-11-05",
    audience: "전 학년",
  },
  {
    title: "겨울 방학 프로그램 안내",
    date: "2025-11-10",
    audience: "2, 3학년",
  },
];

export default async function TeacherAnnouncementsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  const t = getTranslations("ko");
  const copy = t.dashboard.teacherSections.announcements;

  return (
    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
        <p className="text-sm text-gray-600">{copy.description}</p>
      </header>

      <section className="space-y-4">
        <div className="rounded-lg border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-900">최근 공지</h2>
          <ul className="mt-3 space-y-3 text-sm text-gray-700">
            {announcements.map((item) => (
              <li key={item.title} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{item.title}</span>
                  <span className="text-xs text-gray-500">{item.date}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">대상: {item.audience}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-900">새 공지 작성</h2>
          <p className="mt-2 text-sm text-gray-600">
            공지 제목과 내용을 작성하여 학급, 학년, 전교 등 대상 범위를 지정하고 배포할 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  );
}

