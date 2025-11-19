import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import dynamic from "next/dynamic";

const AnnouncementComposer = dynamic(
  () => import("@/components/dashboard/AnnouncementComposer").then((mod) => mod.AnnouncementComposer),
  { ssr: false, loading: () => <div className="rounded-2xl border border-gray-200 bg-white p-6">에디터를 불러오는 중...</div> }
);


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
  const authorName = session.user.name || session.user.email || "담당 교사";

  return (
    <div>
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
          <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
          <p className="text-sm text-gray-600">{copy.description}</p>
          </div>
        </header>
          <AnnouncementComposer authorName={authorName} />
      </div>
      <section className="space-y-4">
          <div className="rounded-lg border border-gray-100 p-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 공지</h2>
          </div>

        </section>
    </div>
  );
}

