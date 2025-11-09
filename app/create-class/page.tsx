import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CreateClassForm from "@/components/dashboard/CreateClassForm";

export default async function CreateClassPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  const instructorName = session.user.name || session.user.email;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">수업 생성</h1>
          <p className="mt-2 text-gray-600 text-sm">
            새 수업 정보를 입력하고 학급에 공유할 수 있습니다.
          </p>
        </div>
        <CreateClassForm instructorName={instructorName ?? ""} />
      </div>
    </div>
  );
}

