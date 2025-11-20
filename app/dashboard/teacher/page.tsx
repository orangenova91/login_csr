import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import WeeklyScheduleSection from "@/components/dashboard/WeeklyScheduleSection";

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

type ClassGroupSchedule = {
  day: string;
  period: string;
};

type ClassGroupSummary = {
  id: string;
  name: string;
  period: string | null;
  schedules: string;
  studentIds: string[];
};

type TeacherCourse = {
  id: string;
  academicYear: string;
  semester: string;
  subjectGroup: string;
  subjectArea: string;
  careerTrack: string;
  subject: string;
  grade: string;
  instructor: string;
  classroom: string;
  description: string;
  joinCode: string | null;
  createdAt: Date;
  classGroups: ClassGroupSummary[];
};

type TeacherCourseWithTodayGroups = TeacherCourse & {
  todayGroups: ClassGroupSummary[];
};

const formatGrade = (grade: string) => {
  switch (grade) {
    case "1":
      return "1학년";
    case "2":
      return "2학년";
    case "3":
      return "3학년";
    default:
      return grade;
  }
};

const getDayOfWeek = (date: Date): string => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[date.getDay()];
};

const parseSchedules = (value: string): ClassGroupSchedule[] => {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (schedule): schedule is ClassGroupSchedule =>
          typeof schedule?.day === "string" && typeof schedule?.period === "string"
      );
    }
    return [];
  } catch {
    return [];
  }
};

export default async function TeacherDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  const teacherId = session.user.id;
  const today = new Date();
  const todayDay = getDayOfWeek(today);

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

  const classes: TeacherCourse[] = teacherId
    ? await (
        prisma as unknown as {
          course: {
            findMany: (args: {
              where: { teacherId: string };
              orderBy: { createdAt: "desc" };
              include: { classGroups: true };
            }) => Promise<TeacherCourse[]>;
          };
        }
      ).course.findMany({
        where: { teacherId },
        orderBy: { createdAt: "desc" },
        include: { classGroups: true },
      })
    : [];

  const todaysClasses: TeacherCourseWithTodayGroups[] = classes
    .map((course) => {
      const todayGroups = course.classGroups.filter((group) => {
        const schedules = parseSchedules(group.schedules);
        return schedules.some((schedule) => schedule.day === todayDay);
      });
      return { ...course, todayGroups };
    })
    .filter((course) => course.todayGroups.length > 0);

  const todaysGroupCount = todaysClasses.reduce(
    (total, course) => total + course.todayGroups.length,
    0
  );

  const dayFormatter = new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

  const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isoToday = today.toISOString().split("T")[0];

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
        displayTime: timeFormatter.format(event.startDate),
        eventType: event.eventType,
        department: event.department ?? undefined,
        description: event.description ?? "",
        startDateISO: event.startDate.toISOString(),
        endDateISO: event.endDate ? event.endDate.toISOString() : null,
        scope: event.scope,
        responsiblePerson: event.responsiblePerson ?? undefined,
        dateLabel: dayFormatter.format(date),
      }));

    return {
      dateLabel: dayFormatter.format(date),
      isoDate: date.toISOString().split("T")[0],
      events: eventsForDay,
    };
  });

  return (
    <div className="space-y-6">
      <header className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          안녕하세요 {session.user.name ?? t.dashboard.roleTeacher} 선생님 반갑습니다. :)
        </h2>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
        오늘은{" "}
          {new Intl.DateTimeFormat("ko-KR", {
            month: "2-digit",
            day: "2-digit",
            weekday: "long",
          }).format(now)}{" "}
          입니다. 오늘 선생님의 수업은 {todaysGroupCount}개 입니다.
        </div>
      </header>
            
      <WeeklyScheduleSection schedule={weeklySchedule} todayIsoDate={isoToday} />

      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">오늘 수업 예정 학반</h2>
          <span className="text-sm text-gray-500">총 {todaysGroupCount}개 학반</span>
        </div>
        {todaysClasses.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">
            오늘 일정에 해당하는 수업이 없습니다. 학반에 요일 스케줄을 등록하면 이곳에 표시됩니다.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {todaysClasses.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/teacher/manage-classes/${course.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-between transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <article className="flex h-full flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      {(course.academicYear?.trim() || course.semester?.trim()) && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          {course.academicYear?.trim() && (
                            <span>{course.academicYear.trim()}학년도</span>
                          )}
                          {course.semester?.trim() && <span>{course.semester.trim()}</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-1 overflow-hidden">
                          {course.joinCode ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-0.5 font-medium text-indigo-700 border border-indigo-100">
                              <span className="uppercase tracking-wide text-[10px] text-indigo-500">
                                코드
                              </span>
                              <span className="font-mono text-sm">{course.joinCode}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">수업 코드 미발급</span>
                          )}
                        </div>
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 border border-slate-200">
                          {formatGrade(course.grade)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1 text-center">
                          {course.subject}
                        </h3>
                        <dl className="space-y-1 text-right text-sm text-gray-600">
                          <div className="flex items-center justify-end gap-2">
                            <dt className="font-medium text-gray-500">강사</dt>
                            <dd>{course.instructor}</dd>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <dt className="font-medium text-gray-500">강의실</dt>
                            <dd>{course.classroom}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {course.todayGroups.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                          <span>오늘 수업 학반</span>
                          <span className="text-xs text-gray-500">
                            총 {course.todayGroups.length}개
                          </span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {course.todayGroups.map((group) => {
                            const schedules = parseSchedules(group.schedules);
                            const todaysSchedules = schedules.filter(
                              (schedule) => schedule.day === todayDay
                            );
                            return (
                              <div
                                key={group.id}
                                className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-gray-900">
                                    {group.name}
                                  </span>
                                  {group.period && (
                                    <span className="text-xs text-gray-500">차시 {group.period}</span>
                                  )}
                                </div>
                                {todaysSchedules.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                    {todaysSchedules.map((schedule, index) => (
                                      <span
                                        key={`${group.id}-schedule-${index}`}
                                        className="rounded-md bg-white px-2 py-1 border border-gray-200"
                                      >
                                        {schedule.day} {schedule.period}교시
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="mt-2 text-xs text-gray-500">
                                  학생 {group.studentIds.length}명
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-500">
                        오늘 수업이 예정된 학반이 없습니다.
                      </p>
                    )}
                  </div>

                  <footer className="mt-4 text-xs text-gray-400">
                    생성일 · {course.createdAt.toLocaleString("ko-KR")}
                  </footer>
                </article>
              </Link>
            ))}
          </div>
        )}
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

