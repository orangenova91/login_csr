import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

const mockStudents = [
  { name: "김민지", className: "2-1", progress: 92, status: "성실" },
  { name: "박현우", className: "2-1", progress: 78, status: "보통" },
  { name: "이서준", className: "3-2", progress: 65, status: "보충 필요" },
];

export default async function StudentProgressPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  const t = getTranslations("ko");
  const copy = t.dashboard.teacherSections.studentProgress;

  return (
    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
        <p className="mt-2 text-sm text-gray-600">{copy.description}</p>
      </header>

      <section className="space-y-4">
        <div className="rounded-lg border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-900">최근 제출 현황</h2>
          <table className="mt-3 w-full table-auto text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2 pr-4">학생</th>
                <th className="py-2 pr-4">반</th>
                <th className="py-2 pr-4">평균 성취도</th>
                <th className="py-2">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {mockStudents.map((student) => (
                <tr key={student.name}>
                  <td className="py-3 pr-4 font-medium">{student.name}</td>
                  <td className="py-3 pr-4">{student.className}</td>
                  <td className="py-3 pr-4">{student.progress}%</td>
                  <td className="py-3">{student.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-900">알림 설정</h2>
          <p className="mt-2 text-sm text-gray-600">
            학생별 성취도 하락, 과제 미제출 등의 이벤트가 발생하면 알림을 받을 수 있도록 설정할 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  );
}

