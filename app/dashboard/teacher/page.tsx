import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

const t = getTranslations("ko");

const teacherSections = [
  {
    key: "manageClasses",
    title: t.dashboard.teacherSections.manageClasses.title,
    description: t.dashboard.teacherSections.manageClasses.description,
    action: t.dashboard.teacherSections.manageClasses.action,
  },
  {
    key: "studentProgress",
    title: t.dashboard.teacherSections.studentProgress.title,
    description: t.dashboard.teacherSections.studentProgress.description,
    action: t.dashboard.teacherSections.studentProgress.action,
  },
  {
    key: "announcements",
    title: t.dashboard.teacherSections.announcements.title,
    description: t.dashboard.teacherSections.announcements.description,
    action: t.dashboard.teacherSections.announcements.action,
  },
];

const upcomingLessons = [
  {
    title: "2학년 과학 실험 수업",
    time: "11월 11일 (월) 09:00",
    location: "과학실 2",
  },
  {
    title: "3학년 진로 상담",
    time: "11월 12일 (화) 13:30",
    location: "상담실",
  },
];

const quickNotes = [
  {
    title: "1학년 기말고사 공지",
    date: "2025-11-15",
  },
  {
    title: "교원 협의회",
    date: "2025-11-18",
  },
];

export default async function TeacherDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getDay(); // 0 (Sun) - 6 (Sat)
  const offset = (day + 6) % 7; // convert to Monday-start
  weekStart.setDate(weekStart.getDate() - offset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  weekEnd.setHours(0, 0, 0, 0);

  const weeklyCalendarEvents = await prisma.calendarEvent.findMany({
    where: {
      OR: [
        { scope: "school", school: session.user.school || undefined },
        { scope: "personal", teacherId: session.user.id },
      ],
      startDate: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    orderBy: { startDate: "asc" },
  });

  const dayFormatter = new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

  const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const weeklySchedule = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const eventsForDay = weeklyCalendarEvents
      .filter(
        (event) => event.startDate >= dayStart && event.startDate < dayEnd
      )
      .map((event) => ({
        id: event.id,
        title: event.title,
        time: timeFormatter.format(event.startDate),
        eventType: event.eventType,
        department: event.department ?? undefined,
      }));

    return {
      dateLabel: dayFormatter.format(date),
      events: eventsForDay,
    };
  });

  return (
    <div className="space-y-6">
      <header className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t.dashboard.teacherTitle}
        </h2>
        <p className="text-gray-600">{t.dashboard.teacherDescription}</p>
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          {session.user.school
            ? `${session.user.school} · ${t.dashboard.roleTeacher}`
            : t.dashboard.roleTeacher}
        </div>
      </header>
            
      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">이번 주 학사일정</h3>
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="hidden md:grid grid-cols-7 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {weeklySchedule.map((day) => (
              <div key={`${day.dateLabel}-header`} className="px-4 py-3 border-r border-gray-100 last:border-r-0">
                {day.dateLabel}
              </div>
            ))}
          </div>
          <div className="md:hidden grid grid-cols-2 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50">
            {weeklySchedule.map((day) => (
              <div key={`${day.dateLabel}-header-mobile`} className="px-2 py-2 border-r border-gray-100 last:border-r-0">
                {day.dateLabel}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {weeklySchedule.map((day) => (
              <div key={`${day.dateLabel}-body`} className="min-h-[220px] p-4 space-y-3">
                <p className="md:hidden text-sm font-semibold text-gray-900">{day.dateLabel}</p>
                {day.events.length === 0 ? (
                  <p className="text-xs text-gray-400">등록된 일정이 없습니다.</p>
                ) : (
                  day.events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-gray-100 bg-white/50 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{event.time}</span>
                        <span className="text-[11px] font-medium text-blue-600">{event.eventType}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-900">{event.title}</p>
                      {event.department && (
                        <p className="text-[11px] text-gray-500 mt-1">담당: {event.department}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teacherSections.map((section) => (
          <article
            key={section.key}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{section.description}</p>
            <button
              type="button"
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {section.action}
            </button>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            {t.dashboard.teacherScheduleTitle}
          </h3>
          <ul className="mt-4 space-y-3">
            {upcomingLessons.length === 0 ? (
              <li className="text-sm text-gray-600">
                {t.dashboard.teacherScheduleEmpty}
              </li>
            ) : (
              upcomingLessons.map((lesson) => (
                <li
                  key={lesson.title}
                  className="flex flex-col rounded-lg border border-gray-100 p-4"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {lesson.title}
                  </span>
                  <span className="text-sm text-gray-600 mt-1">{lesson.time}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {lesson.location}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            {t.dashboard.teacherSections.announcements.title}
          </h3>
          <ul className="mt-4 space-y-3">
            {quickNotes.map((note) => (
              <li
                key={note.title}
                className="flex flex-col rounded-lg border border-gray-100 p-4"
              >
                <span className="text-sm font-medium text-gray-900">
                  {note.title}
                </span>
                <span className="text-xs text-gray-500 mt-1">{note.date}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

    </div>
  );
}

