import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import { Users, UserPlus, Megaphone, Settings } from "lucide-react";
import { UsersTable } from "../../../../components/dashboard/admin/UsersTable";
import { CsvUploader } from "../../../../components/dashboard/admin/CsvUploader";

const userDistribution = [
  { label: "학생", count: "3,420", ratio: 71, accent: "bg-blue-100 text-blue-600" },
  { label: "교사", count: "860", ratio: 18, accent: "bg-purple-100 text-purple-600" },
  { label: "학부모", count: "390", ratio: 8, accent: "bg-pink-100 text-pink-600" },
  { label: "관리자", count: "45", ratio: 3, accent: "bg-slate-100 text-slate-700" },
];

const quickActions = [
  {
    label: "새 관리자 초대",
    description: "시스템 접근 권한을 가진 운영자를 추가합니다.",
    icon: UserPlus,
  },
  {
    label: "긴급 공지 발송",
    description: "SMS/푸시/메일로 일괄 안내합니다.",
    icon: Megaphone,
  },
  {
    label: "시스템 점검 예약",
    description: "Maintenance 모드를 안내하고 일정을 잡습니다.",
    icon: Settings,
  },
];

const pendingApprovals = [
  {
    id: "REQ-2025-1182",
    name: "이은지",
    role: "교사",
    school: "서울과학고",
    submittedAt: "11:04",
    status: "학교 인증 대기",
  },
  {
    id: "REQ-2025-1180",
    name: "김태훈",
    role: "학부모",
    school: "중앙중학교",
    submittedAt: "09:32",
    status: "추가 서류 필요",
  },
  {
    id: "REQ-2025-1174",
    name: "박소연",
    role: "교사",
    school: "한빛초등학교",
    submittedAt: "어제",
    status: "승인 대기",
  },
];

const activityTimeline = [
  {
    time: "10:24",
    actor: "이수민 (관리자)",
    action: "교사 계정 12명 CSV 업로드",
  },
  {
    time: "09:10",
    actor: "김재훈 (슈퍼관리자)",
    action: "정책 > 2단계 인증 필수 적용",
  },
  {
    time: "어제",
    actor: "박민정 (관리자)",
    action: "겨울방학 안내 공지 예약 발행",
  },
];

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin" && session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  type StudentProfileSummary = {
    userId: string;
    grade: string | null;
    classLabel: string | null;
    section: string | null;
    studentId: string | null;
  };

  const prismaAny = prisma as any;

  // 관리자의 학교 정보 가져오기
  const adminSchool = session.user.school;

  // superadmin인 경우 모든 사용자, admin인 경우 같은 학교의 사용자만
  const userWhereCondition = session.user.role === "superadmin" 
    ? undefined 
    : adminSchool 
    ? { school: adminSchool }
    : { school: null }; // 학교 정보가 없는 경우 빈 결과

  // 먼저 사용자 목록 가져오기
  const users = await prisma.user.findMany({
    where: userWhereCondition,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      school: true,
      role: true,
      createdAt: true,
      // hashedPassword는 제외 (보안상 노출하지 않음)
    },
  });

  // 해당 사용자들의 studentProfile 가져오기
  const userIds = users.map((user) => user.id);
  const studentProfiles = userIds.length > 0
    ? ((await prismaAny.studentProfile.findMany({
        where: {
          userId: { in: userIds },
        },
        select: {
          userId: true,
          grade: true,
          classLabel: true,
          section: true,
          studentId: true,
        },
      })) as StudentProfileSummary[])
    : [];

  const studentProfileMap = new Map<string, StudentProfileSummary>(
    studentProfiles.map((profile) => [profile.userId, profile]),
  );
  const tableRows = users.map((user) => {
    const studentProfile = studentProfileMap.get(user.id);
    return {
      id: user.id,
      name: user.name ?? "-",
      school: user.school ?? "-",
      role: user.role ?? "미지정",
      studentId: user.role === "student" ? studentProfile?.studentId ?? "-" : "-",
      grade: user.role === "student" ? studentProfile?.grade ?? "-" : "-",
      className: user.role === "student" ? studentProfile?.classLabel ?? "-" : "-",
      createdAt: user.createdAt.toISOString(),
      email: user.email,
    };
  });

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-gray-500">Admin · Users</p>
        <h1 className="text-3xl font-bold mt-1 text-gray-900">사용자 & 권한 관리</h1>
        <p className="text-gray-500 mt-2">
          역할 분포, 계정 승인, 빠른 운영 작업을 중앙에서 처리합니다.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">역할별 분포</p>
              <p className="text-xs text-gray-500 mt-1">실시간 반영 · 주간 비교</p>
            </div>
            <span className="text-xs text-gray-500">업데이트 2분 전</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {userDistribution.map((segment) => (
              <div
                key={segment.label}
                className="border border-gray-100 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500">{segment.label}</p>
                  <p className="text-xl font-semibold text-gray-900">{segment.count}</p>
                </div>
                <p className={`text-xs font-semibold px-3 py-1 rounded-full ${segment.accent}`}>
                  {segment.ratio}%
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-dashed border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">2단계 인증 적용 현황</p>
              <p className="text-xs text-gray-500 mt-1">관리자 45명 중 41명 완료</p>
            </div>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-500">
              정책 업데이트
            </button>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-gray-800">빠른 작업</p>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                className="w-full text-left border border-gray-100 rounded-xl px-4 py-3 hover:border-blue-200 hover:bg-blue-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-full bg-blue-50 text-blue-600">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">승인 대기</p>
            <span className="text-xs text-gray-500">오늘 7건</span>
          </div>
          <div className="mt-4 divide-y divide-gray-100">
            {pendingApprovals.map((request) => (
              <div key={request.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{request.name}</p>
                  <p className="text-xs text-gray-500">
                    {request.role} · {request.school}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{request.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{request.submittedAt}</p>
                  <div className="mt-2 space-x-2">
                    <button className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-red-200 hover:text-red-600">
                      반려
                    </button>
                    <button className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500">
                      승인
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">최근 관리자 활동</p>
          <ul className="mt-4 space-y-4">
            {activityTimeline.map((item) => (
              <li key={item.actor} className="flex items-start gap-3">
                <div className="rounded-full bg-slate-100 text-slate-600 p-2">
                  <ClockIcon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.actor}</p>
                  <p className="text-xs text-gray-500">{item.action}</p>
                </div>
                <span className="text-xs text-gray-400 ml-auto">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <CsvUploader />
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">전체 사용자</p>
            <p className="text-xs text-gray-500 mt-1">
              프로필과 역할 정보를 포함한 최신 사용자 현황입니다.
            </p>
          </div>
          <span className="text-xs text-gray-500">{users.length}명</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <UsersTable rows={tableRows} initialPageSize={20} />
        </div>
      </section>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
      <path d="M12 7v5l3 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

