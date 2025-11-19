import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Shield, Users, GraduationCap, Megaphone, Bell } from "lucide-react";

const adminMetrics = [
  {
    label: "총 사용자",
    value: "4,820",
    caption: "지난 7일 +120",
    icon: Users,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "활성 학급",
    value: "132",
    caption: "담당 교사 58명",
    icon: GraduationCap,
    accent: "bg-indigo-50 text-indigo-600",
  },
  {
    label: "공지 도달률",
    value: "92%",
    caption: "열람 미확인 18건",
    icon: Megaphone,
    accent: "bg-amber-50 text-amber-600",
  },
  {
    label: "알림 성공률",
    value: "99.2%",
    caption: "지난 24시간 12,430건",
    icon: Bell,
    accent: "bg-emerald-50 text-emerald-600",
  },
];

const upcomingAgenda = [
  {
    title: "중간 점검 회의",
    detail: "11월 19일 09:30 · 온라인",
    badge: "준비 중",
    badgeClass: "text-blue-700 bg-blue-50",
  },
  {
    title: "시스템 점검",
    detail: "11월 22일 22:00",
    badge: "공지 필요",
    badgeClass: "text-orange-700 bg-orange-50",
  },
  {
    title: "위원회 보고",
    detail: "11월 25일 14:00",
    badge: "준비 완료",
    badgeClass: "text-emerald-700 bg-emerald-50",
  },
];

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-10">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">SchoolHub Admin</p>
            <h1 className="mt-2 text-3xl font-bold">운영 현황 센터</h1>
            <p className="mt-2 text-slate-200">
              전체 학사 시스템, 사용자, 알림 채널을 한눈에 조정합니다.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="text-slate-400">현재 로그인</p>
              <p className="font-semibold">{session.user.name || session.user.email}</p>
            </div>
            <div>
              <p className="text-slate-400">소속 기관</p>
              <p className="font-semibold">{session.user.school || "미지정"}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="bg-white/5 rounded-xl p-4">
                <div className={`inline-flex items-center justify-center rounded-full p-2 ${metric.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="mt-4 text-sm text-slate-300">{metric.label}</p>
                <p className="text-2xl font-semibold">{metric.value}</p>
                <p className="text-xs text-slate-400">{metric.caption}</p>
              </div>
            );
          })}
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-gray-900">핵심 운영 KPI</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">사용자 활성도</p>
                <p className="text-3xl font-bold mt-1">78%</p>
              </div>
              <div className="text-sm text-emerald-600">지난달 대비 +6.4%</div>
            </div>
            <div className="mt-6 h-36 rounded-xl bg-gradient-to-r from-blue-50 via-white to-emerald-50 border border-dashed border-blue-100 flex items-center justify-center text-sm text-gray-500">
              일일 로그인·과제 제출·공지 열람을 합산한 복합 지표 영역 (차트 자리)
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700">주요 일정</p>
            <ul className="mt-4 space-y-3">
              {upcomingAgenda.map((agenda) => (
                <li key={agenda.title} className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{agenda.title}</p>
                    <p className="text-sm text-gray-500">{agenda.detail}</p>
                  </div>
                  <span className={`text-xs font-medium rounded-full px-3 py-1 ${agenda.badgeClass}`}>
                    {agenda.badge}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

