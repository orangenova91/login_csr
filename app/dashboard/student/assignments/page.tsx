import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

const assignments = [
  {
    title: "역사 독후감 제출",
    subject: "역사",
    due: "11월 12일 (화)",
    status: "제출 대기",
  },
  {
    title: "수학 문제집 5단원",
    subject: "수학",
    due: "11월 13일 (수)",
    status: "진행 중",
  },
];

export default async function StudentAssignmentsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.studentAssignmentsTitle}</h1>
        <p className="mt-2 text-sm text-gray-600">
          마감이 임박한 과제와 제출 현황을 확인하세요.
        </p>
      </header>

      <section className="rounded-lg border border-gray-100 p-4">
        <ul className="space-y-3 text-sm text-gray-700">
          {assignments.length === 0 ? (
            <li>{t.dashboard.studentAssignmentsEmpty}</li>
          ) : (
            assignments.map((assignment) => (
              <li key={assignment.title} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{assignment.title}</span>
                  <span className="text-xs text-gray-500">{assignment.due}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {assignment.subject} · {assignment.status}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

