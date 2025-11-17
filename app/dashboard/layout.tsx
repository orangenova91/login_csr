import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import SignOutButton from "@/components/dashboard/SignOutButton";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Footer } from "@/components/dashboard/Footer";
import { 
  Home, 
  Calendar, 
  BookOpen, 
  FileText, 
  Folder, 
  BarChart, 
  Users, 
  Settings,
  TrendingUp,
  Bell,
  HelpCircle
} from "lucide-react";

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
            label: t.sidebar.teacher.overview,
            icon: <Home className="w-5 h-5" />
          },
          {
            href: "/dashboard/teacher/schedule",
            label: t.sidebar.teacher.schedule,
            icon: <Calendar className="w-5 h-5" />
          },
          {
            href: "/dashboard/teacher/manage-classes",
            label: t.sidebar.teacher.manageClasses,
            icon: <BookOpen className="w-5 h-5" />
          },
          {
            href: "/dashboard/teacher/class-management",
            label: t.sidebar.teacher.classManagement,
            icon: <Users className="w-5 h-5" />
          },
          {
            href: "/dashboard/teacher/student-progress",
            label: t.sidebar.teacher.studentProgress,
            icon: <TrendingUp className="w-5 h-5" />
          },
          {
            href: "/dashboard/teacher/announcements",
            label: t.sidebar.teacher.announcements,
            icon: <Bell className="w-5 h-5" />
          },
        ]
      : role === "student"
      ? [
          { 
            href: "/dashboard/student", 
            label: t.sidebar.student.overview,
            icon: <Home className="w-5 h-5" />
          },
          {
            href: "/dashboard/student/schedule",
            label: t.sidebar.student.todaysSchedule,
            icon: <Calendar className="w-5 h-5" />
          },
          {
            href: "/dashboard/student/assignments",
            label: t.sidebar.student.assignments,
            icon: <FileText className="w-5 h-5" />
          },
          {
            href: "/dashboard/student/announcements",
            label: t.sidebar.student.announcements,
            icon: <Bell className="w-5 h-5" />
          },
          {
            href: "/dashboard/student/support",
            label: t.sidebar.student.support,
            icon: <HelpCircle className="w-5 h-5" />
          },
        ]
      : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
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

      <Sidebar items={navItems} />
      <main className="pl-24 xl:pl-28 pt-20 pb-10 sm:px-8 lg:px-10 flex-1 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <section className="w-full">{children}</section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

