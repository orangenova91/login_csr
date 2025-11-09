"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getTranslations } from "@/lib/i18n";

const t = getTranslations("ko");

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SchoolHub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user?.name || session.user?.email}
              </span>
              <Button onClick={handleLogout} variant="outline">
                {t.auth.logout}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t.dashboard.welcome}, {session.user?.name || session.user?.email}!
            </h2>
            <p className="text-gray-600 mb-4">{t.dashboard.protectedContent}</p>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">사용자 정보</h3>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">
                  <strong>이메일:</strong> {session.user?.email}
                </p>
                {session.user?.name && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>이름:</strong> {session.user.name}
                  </p>
                )}
                {session.user?.school && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>{t.dashboard.school}:</strong> {session.user.school}
                  </p>
                )}
                {session.user?.role && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>{t.dashboard.role}:</strong>{" "}
                    {session.user.role === "student"
                      ? t.dashboard.roleStudent
                      : session.user.role === "teacher"
                      ? t.dashboard.roleTeacher
                      : session.user.role}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

