import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { FileText, Activity, Shield } from "lucide-react";

const reportShortcuts = [
  {
    title: "출결·과제 요약",
    description: "주간 반별 출결/제출 현황 엑셀 다운로드",
    icon: FileText,
    frequency: "매주 월요일 자동 발송",
  },
  {
    title: "사용량 리포트",
    description: "기기/브라우저/피크타임 대시보드",
    icon: Activity,
    frequency: "수동 생성",
  },
  {
    title: "감사 로그",
    description: "관리자 작업 이력 CSV",
    icon: Shield,
    frequency: "지난 24시간 182건",
  },
];

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-gray-500">Admin · Reports</p>
        <h1 className="text-3xl font-bold mt-1 text-gray-900">리포트 & 감사</h1>
        <p className="text-gray-500 mt-2">
          정기 리포트, 감사 로그, 다운로드 히스토리를 신속하게 확인합니다.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {reportShortcuts.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-full bg-slate-50 text-slate-700">
                  <Icon className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{report.title}</p>
                  <p className="text-xs text-gray-500">{report.frequency}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">{report.description}</p>
              <button className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-500">
                지금 내려받기
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}

