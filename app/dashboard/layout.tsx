import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import SignOutButton from "@/components/dashboard/SignOutButton";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Footer } from "@/components/dashboard/Footer";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
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
  HelpCircle,
  Shield,
  User,
  MessageCircle,
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
          {
            href: "/dashboard/chat",
            label: t.sidebar.teacher.chat,
            icon: <MessageCircle className="w-5 h-5" />
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
          {
            href: "/dashboard/student/profile",
            label: "프로필 수정",
            icon: <User className="w-5 h-5" />
          },
          {
            href: "/dashboard/chat",
            label: t.sidebar.student.chat,
            icon: <MessageCircle className="w-5 h-5" />
          },
        ]
      : role === "admin"
      ? [
          {
            href: "/dashboard/admin/overview",
            label: "운영 현황",
            icon: <Shield className="w-5 h-5" />,
          },
          {
            href: "/dashboard/admin/users",
            label: "사용자 관리",
            icon: <Users className="w-5 h-5" />,
          },
          {
            href: "/dashboard/admin/content",
            label: "콘텐츠·공지",
            icon: <Folder className="w-5 h-5" />,
          },
          {
            href: "/dashboard/admin/alerts",
            label: "알림 센터",
            icon: <Bell className="w-5 h-5" />,
          },
          {
            href: "/dashboard/admin/reports",
            label: "리포트",
            icon: <BarChart className="w-5 h-5" />,
          },
          {
            href: "/dashboard/admin/system",
            label: "시스템 설정",
            icon: <Settings className="w-5 h-5" />,
          },
          {
            href: "/dashboard/chat",
            label: t.sidebar.admin?.chat || "채팅",
            icon: <MessageCircle className="w-5 h-5" />,
          },
        ]
      : role === "superadmin"
      ? [
          {
            href: "/dashboard/superadmin",
            label: "슈퍼어드민 대시보드",
            icon: <Shield className="w-5 h-5" />,
          },
          {
            href: "/dashboard/chat",
            label: t.sidebar.superadmin?.chat || "채팅",
            icon: <MessageCircle className="w-5 h-5" />,
          },
        ]
      : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col relative overflow-hidden">
      <AnimatedBackground />
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm fixed top-0 left-0 right-0 z-50 border-b border-white/20">
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
      <main className="ml-16 xl:ml-20 pt-20 pb-10 px-4 sm:px-8 lg:px-10 flex-1 transition-all duration-300 relative z-10">
        <div className="max-w-7xl mx-auto">
          <section className="w-full">{children}</section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

