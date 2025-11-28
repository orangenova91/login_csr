import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import dynamic from "next/dynamic";

const AnnouncementList = dynamic(
  () => import("@/components/dashboard/AnnouncementList").then((mod) => mod.AnnouncementList),
  { ssr: false }
);

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

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <AnnouncementList includeScheduled={false} />
      </section>
    </div>
  );
}

