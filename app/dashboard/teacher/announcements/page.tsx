import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import dynamic from "next/dynamic";

const AnnouncementPageClient = dynamic(
  () => import("./AnnouncementPageClient").then((mod) => mod.AnnouncementPageClient),
  { ssr: false, loading: () => <div className="rounded-2xl border border-gray-200 bg-white p-6">로딩 중...</div> }
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
    <AnnouncementPageClient 
      title={copy.title}
      description={copy.description}
      authorName={authorName}
      includeScheduled={true}
    />
  );
}

