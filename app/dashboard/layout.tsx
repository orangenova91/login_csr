import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import SignOutButton from "@/components/dashboard/SignOutButton";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const t = getTranslations("ko");
  const role = session.user.role;

  const navItems =
    role === "teacher"
      ? [
          { 
            href: "/dashboard/teacher", 
            label: t.sidebar.teacher.overview 
          },
          {
            href: "/dashboard/teacher/manage-classes",
            label: t.sidebar.teacher.manageClasses,
          },
          {
            href: "/dashboard/teacher/student-progress",
            label: t.sidebar.teacher.studentProgress,
          },
          {
            href: "/dashboard/teacher/announcements",
            label: t.sidebar.teacher.announcements,
          },
          {
            href: "/dashboard/teacher/schedule",
            label: t.sidebar.teacher.schedule,
          },
        ]
      : role === "student"
      ? [
          { 
            href: "/dashboard/student", 
            label: t.sidebar.student.overview 
          },
          {
            href: "/dashboard/student/schedule",
            label: t.sidebar.student.todaysSchedule,
          },
          {
            href: "/dashboard/student/assignments",
            label: t.sidebar.student.assignments,
          },
          {
            href: "/dashboard/student/announcements",
            label: t.sidebar.student.announcements,
          },
          {
            href: "/dashboard/student/support",
            label: t.sidebar.student.support,
          },
        ]
      : [];

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
                {session.user?.name || session.user.email}
              </span>
              <SignOutButton label={t.auth.logout} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <Sidebar items={navItems} />
          <section className="flex-1 w-full">{children}</section>
        </div>
      </main>
    </div>
  );
}

