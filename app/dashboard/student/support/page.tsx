import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

export default async function StudentSupportPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">{t.sidebar.student.support}</h1>
        <p className="mt-2 text-sm text-gray-600">
          학습, 생활, 진로 등 도움이 필요한 내용을 상담 선생님께 문의하세요.
        </p>
      </header>

      <section className="rounded-lg border border-gray-100 p-4 space-y-3 text-sm text-gray-700">
        <div>
          <p className="font-medium text-gray-900">상담실 위치</p>
          <p className="mt-1 text-gray-600">본관 2층 학생 상담실</p>
        </div>
        <div>
          <p className="font-medium text-gray-900">상담 가능 시간</p>
          <p className="mt-1 text-gray-600">평일 09:00 - 17:00 (점심시간 제외)</p>
        </div>
        <div>
          <p className="font-medium text-gray-900">문의 방법</p>
          <ul className="mt-1 space-y-1">
            <li>· 상담실 방문 예약</li>
            <li>· 담임 선생님께 요청</li>
            <li>· 이메일: counselor@schoolhub.kr</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

