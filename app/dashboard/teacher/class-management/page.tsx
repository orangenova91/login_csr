import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

export default async function ClassManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  const t = getTranslations("ko");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {t.sidebar.teacher.classManagement}
        </h1>
        <p className="text-sm text-gray-600">
          학급 구성을 관리하고 학생 정보를 빠르게 파악할 수 있도록 준비 중입니다.
        </p>
      </header>

      <section className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-6 text-center">
        <p className="text-sm text-gray-500">
          아직 준비 중인 영역입니다. 필요한 기능이나 아이디어가 있다면 알려주세요!
        </p>
      </section>
    </div>
  );
}

