import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Bell, Lock } from "lucide-react";

const notificationQueue = [
  {
    type: "푸시",
    topic: "출결 미등록 알림",
    target: "교사 58명",
    status: "발송 중",
    successRate: "99.8%",
  },
  {
    type: "SMS",
    topic: "학사 공지 확인 요청",
    target: "학부모 320명",
    status: "예약 18:30",
    successRate: "-",
  },
  {
    type: "이메일",
    topic: "시스템 점검 안내",
    target: "전체 관리자",
    status: "완료",
    successRate: "98.2%",
  },
];

const securityAlerts = [
  {
    severity: "warning",
    title: "다중 로그인 시도",
    detail: "admin@district.go.kr 계정에서 해외 IP 접근",
    time: "5분 전",
    action: "세션 강제 종료",
  },
  {
    severity: "info",
    title: "비밀번호 재설정 증가",
    detail: "지난 1시간 42건 요청 (평균 대비 +60%)",
    time: "30분 전",
    action: "패턴 모니터링",
  },
];

export default async function AdminAlertsPage() {
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
        <p className="text-sm text-gray-500">Admin · Alerts</p>
        <h1 className="text-3xl font-bold mt-1 text-gray-900">알림 센터 & 보안</h1>
        <p className="text-gray-500 mt-2">
          발송 큐, 재시도 현황, 보안 경보를 실시간으로 모니터링합니다.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-600" />
              <p className="text-sm font-semibold text-gray-900">알림 큐</p>
            </div>
            <span className="text-xs text-gray-500">자동 재시도 활성화</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {notificationQueue.map((item) => (
              <div key={item.topic} className="border border-gray-100 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">{item.type}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{item.topic}</p>
                <p className="text-xs text-gray-500 mt-1">{item.target}</p>
                <p className="text-xs text-gray-400 mt-2">상태: {item.status}</p>
                <p className="text-xs text-emerald-600 mt-1">성공률 {item.successRate}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-500" />
            <p className="text-sm font-semibold text-gray-800">보안 알림</p>
          </div>
          {securityAlerts.map((alert) => (
            <div
              key={alert.title}
              className={`rounded-xl border p-4 ${
                alert.severity === "warning"
                  ? "border-red-100 bg-red-50/60"
                  : "border-blue-100 bg-blue-50/60"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
              <p className="text-xs text-gray-600 mt-1">{alert.detail}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">{alert.time}</span>
                <button className="text-xs font-semibold text-blue-700">{alert.action}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

