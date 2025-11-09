import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

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

  return (
    <div>
        <div className="flex justify-end mb-4">
          <Button variant="primary">
          <Link href="/create-class">수업 생성</Link>
          </Button>
        </div>
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
          <p className="mt-2 text-sm text-gray-600">{copy.description}</p>
        </header>

        <section className="space-y-4">
          <div className="rounded-lg border border-gray-100 p-4">
            <h2 className="text-lg font-semibold text-gray-900">다가오는 수업</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>· 2학년 과학 실험 &mdash; 11월 11일 (월) 09:00 &mdash; 과학실 2</li>
              <li>· 3학년 진로 상담 &mdash; 11월 12일 (화) 13:30 &mdash; 상담실</li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-100 p-4">
            <h2 className="text-lg font-semibold text-gray-900">빠른 작업</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>· 새 수업 일정 추가</li>
              <li>· 과제 업로드 및 배포</li>
              <li>· 학생별 수업 노트 기록</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

