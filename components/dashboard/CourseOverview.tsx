"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import EditCourseForm from "./EditCourseForm";

type CourseOverviewProps = {
  courseId: string;
  course: {
    academicYear: string;
    semester: string;
    grade: string;
    subject: string;
    subjectGroup: string;
    subjectArea: string;
    careerTrack: string;
    instructor: string;
    classroom: string;
    joinCode: string | null;
    description: string;
  };
};

export default function CourseOverview({ courseId, course }: CourseOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getGradeLabel = (grade: string | null) => {
    switch (grade) {
      case "1":
        return "1학년";
      case "2":
        return "2학년";
      case "3":
        return "3학년";
      default:
        return grade ?? "학년 정보 없음";
    }
  };

  if (isEditing) {
    return (
      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">수업 소개</h2>
        </header>
        <EditCourseForm
          key={`edit-${courseId}`}
          courseId={courseId}
          initialData={{
            academicYear: course.academicYear || "",
            semester: course.semester || "",
            subjectGroup: course.subjectGroup || "",
            subjectArea: course.subjectArea || "",
            careerTrack: course.careerTrack || "",
            subject: course.subject || "",
            grade: course.grade || "",
            instructor: course.instructor || "",
            classroom: course.classroom || "",
            description: course.description || "",
          }}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">수업 소개</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          수정
        </Button>
      </header>
      <div className="space-y-6">
        {/* 기본 정보 섹션 */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">기본 정보</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <dt className="text-sm font-medium text-gray-600 min-w-[80px]">학년도</dt>
              <dd className="text-sm font-medium text-gray-900">
                {course.academicYear?.trim() || (
                  <span className="text-gray-400">정보 없음</span>
                )}
              </dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="text-sm font-medium text-gray-600 min-w-[80px]">학기</dt>
              <dd className="text-sm font-medium text-gray-900">
                {course.semester?.trim() || (
                  <span className="text-gray-400">정보 없음</span>
                )}
              </dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="text-sm font-medium text-gray-600 min-w-[80px]">대상 학년</dt>
              <dd className="text-sm font-medium text-gray-900">
                {getGradeLabel(course.grade)}
              </dd>
            </div>
          </dl>
        </div>

        {/* 수업 정보 섹션 */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">수업 정보</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <dt className="text-sm font-medium text-gray-600 min-w-[80px]">교과명</dt>
              <dd className="text-sm font-semibold text-gray-900">{course.subject}</dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="text-sm font-medium text-gray-600 min-w-[80px]">교과군</dt>
              <dd className="text-sm font-medium text-gray-900">
                {course.subjectGroup?.trim() || (
                  <span className="text-gray-400">정보 없음</span>
                )}
              </dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="text-sm font-medium text-gray-600 min-w-[80px]">교과영역</dt>
              <dd className="text-sm font-medium text-gray-900">
                {course.subjectArea?.trim() || (
                  <span className="text-gray-400">정보 없음</span>
                )}
              </dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="text-sm font-medium text-gray-600 min-w-[80px]">진로구분</dt>
              <dd className="text-sm font-medium text-gray-900">
                {course.careerTrack?.trim() || (
                  <span className="text-gray-400">정보 없음</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* 담당 정보 섹션 */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">담당 정보</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <dt className="text-sm font-medium text-gray-600 min-w-[80px]">강사명</dt>
              <dd className="text-sm font-medium text-gray-900">{course.instructor}</dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="text-sm font-medium text-gray-600 min-w-[80px]">강의실</dt>
              <dd className="text-sm font-medium text-gray-900">{course.classroom}</dd>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <dt className="text-sm font-medium text-gray-600 min-w-[80px]">수업 코드</dt>
              <dd className="text-sm font-medium text-gray-900">
                {course.joinCode ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 font-mono text-sm font-semibold text-indigo-700 border border-indigo-200 shadow-sm">
                    {course.joinCode}
                  </span>
                ) : (
                  <span className="text-gray-400">미발급</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* 강의소개 섹션 */}
        {course.description?.trim() && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">강의소개</h3>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-white rounded-md p-4 border border-gray-200">
              {course.description}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

