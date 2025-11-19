import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

const announcements = [
  {
    title: "동아리 박람회 안내",
    date: "2025-11-15",
    summary: "다음 주 토요일에 체육관에서 동아리 박람회가 열립니다.",
  },
  {
    title: "모의고사 일정 안내",
    date: "2025-11-20",
    summary: "11월 마지막 주 수요일에 전학년 모의고사가 진행됩니다.",
  },
];

export default async function StudentAnnouncementsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.studentAnnouncementsTitle}</h1>
        <p className="mt-2 text-sm text-gray-600">
          최근 학교 공지사항을 확인하세요.
        </p>
      </header>

      <section className="rounded-lg border border-gray-100 p-4">
        <ul className="space-y-3 text-sm text-gray-700">
          {announcements.map((announcement) => (
            <li
              key={announcement.title}
              className="rounded-lg border border-gray-100 p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{announcement.title}</span>
                <span className="text-xs text-gray-500">{announcement.date}</span>
              </div>
              <p className="text-xs text-gray-500">{announcement.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

