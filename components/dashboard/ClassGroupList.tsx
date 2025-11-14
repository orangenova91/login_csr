"use client";

import { useEffect, useState } from "react";
import EditClassGroupModal from "./EditClassGroupModal";
import { Button } from "@/components/ui/Button";

type ClassGroup = {
  id: string;
  name: string;
  period: string | null;
  schedules: Array<{ day: string; period: string }>;
  courseId: string;
  studentIds: string[];
  createdAt: string;
};

type Student = {
  id: string;
  name: string | null;
  email: string;
};

type ClassGroupListProps = {
  courseId: string;
  students: Student[];
};

export default function ClassGroupList({
  courseId,
  students,
}: ClassGroupListProps) {
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTick, setUpdateTick] = useState(0);
  const [editingGroup, setEditingGroup] = useState<ClassGroup | null>(null);

  // API에서 학반 데이터 로드
  useEffect(() => {
    const loadClassGroups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/courses/${courseId}/class-groups`
        );

        if (!response.ok) {
          throw new Error("학반 목록을 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        setClassGroups(data.classGroups || []);
      } catch (err) {
        console.error("학반 목록 로드 실패:", err);
        setError("학반 목록을 불러오는데 실패했습니다.");
        setClassGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadClassGroups();
  }, [courseId, updateTick]);

  // 학반 생성 이벤트 리스닝
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as
          | { courseId?: string }
          | undefined;
        if (detail?.courseId && detail.courseId !== courseId) return;
        setUpdateTick((prev) => prev + 1);
      } catch {}
    };

    window.addEventListener(
      "course:classGroups:updated",
      handleUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        "course:classGroups:updated",
        handleUpdate as EventListener
      );
    };
  }, [courseId]);

  // 학생 ID를 학생 정보로 변환
  const getStudentById = (studentId: string): Student | undefined => {
    return students.find((s) => s.id === studentId);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">학반 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (classGroups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">
          생성된 학반이 없습니다. 상단의 "학반 생성" 버튼을 클릭하여 학반을
          만들어보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {classGroups.map((group) => {
        const studentIds = Array.isArray(group.studentIds)
          ? group.studentIds
          : [];
        const groupStudents = studentIds
          .map((id) => getStudentById(id))
          .filter((s): s is Student => s !== undefined);

        return (
          <div
            key={group.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm min-w-[400px] max-w-[600px]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {group.name}
                  {group.period && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      (차시: {group.period})
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingGroup(group)}
                  className="text-xs"
                >
                  학반 정보 수정
                </Button>

              </div>
            </div>

            {Array.isArray(group.schedules) && group.schedules.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {group.schedules.map((schedule, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 border border-blue-100"
                    >
                      {schedule.day} {schedule.period}교시
                    </span>
                  ))}
                </div>
              </div>
            )}

            {groupStudents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-700">
                    수강생 ({groupStudents.length}명)
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      // 출결 저장 로직 추가 예정
                      console.log("출결 저장:", group.id);
                    }}
                    className="text-xs"
                  >
                    출결 저장
                  </Button>
                </div>
                <div className="space-y-2">
                  {groupStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between py-2 px-3 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-900">
                        {student.name ?? student.email}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name={`attendance-${group.id}-${student.id}`}
                            value="present"
                            defaultChecked
                            className="h-4 w-4 text-green-600 focus:ring-green-500"
                          />
                          <span>출석</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name={`attendance-${group.id}-${student.id}`}
                            value="late"
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span>지각</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name={`attendance-${group.id}-${student.id}`}
                            value="sick_leave"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                          />
                          <span>병결</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name={`attendance-${group.id}-${student.id}`}
                            value="approved_absence"
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                          />
                          <span>인정결</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="radio"
                            name={`attendance-${group.id}-${student.id}`}
                            value="excused"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span>공결</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {editingGroup && (
        <EditClassGroupModal
          classGroup={editingGroup}
          courseId={courseId}
          students={students}
          isOpen={!!editingGroup}
          onClose={() => setEditingGroup(null)}
          onUpdated={() => {
            setEditingGroup(null);
            setUpdateTick((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}

