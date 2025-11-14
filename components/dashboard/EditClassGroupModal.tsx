"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Student = {
  id: string;
  name: string | null;
  email: string;
};

type ClassGroup = {
  id: string;
  name: string;
  period: string | null;
  schedules: Array<{ day: string; period: string }>;
  studentIds: string[];
};

type EditClassGroupModalProps = {
  classGroup: ClassGroup;
  courseId: string;
  students: Student[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function EditClassGroupModal({
  classGroup,
  courseId,
  students,
  isOpen,
  onClose,
  onUpdated,
}: EditClassGroupModalProps) {
  const [className, setClassName] = useState("");
  const [period, setPeriod] = useState("1");
  const [schedules, setSchedules] = useState<Array<{ day: string; period: string }>>([
    { day: "", period: "" },
  ]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const daysOfWeek = [
    { value: "", label: "요일 선택" },
    { value: "월", label: "월요일" },
    { value: "화", label: "화요일" },
    { value: "수", label: "수요일" },
    { value: "목", label: "목요일" },
    { value: "금", label: "금요일" },
  ];

  const periods = Array.from({ length: 10 }, (_, i) => ({
    value: `${i + 1}`,
    label: `${i + 1}교시`,
  }));

  // 모달이 열릴 때 기존 데이터로 초기화
  useEffect(() => {
    if (isOpen && classGroup) {
      setClassName(classGroup.name || "");
      setPeriod(classGroup.period || "1");
      setSchedules(
        classGroup.schedules && classGroup.schedules.length > 0
          ? classGroup.schedules
          : [{ day: "", period: "" }]
      );
      setSelectedStudentIds(new Set(classGroup.studentIds || []));
      setSearchQuery("");
      setValidationError(null);
    }
  }, [isOpen, classGroup]);

  const handleClose = useCallback(() => {
    onClose();
    setValidationError(null);
  }, [onClose]);

  const handlePeriodChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
    
    // 차시 개수에 맞춰 schedules 배열 조정
    const periodCount = parseInt(newPeriod, 10) || 0;
    if (periodCount > 0) {
      setSchedules((prev) => {
        const newSchedules = Array.from({ length: periodCount }, (_, index) => {
          return prev[index] || { day: "", period: "" };
        });
        return newSchedules;
      });
    }
  }, []);

  const handleScheduleDayChange = useCallback((index: number, day: string) => {
    setSchedules((prev) => {
      const newSchedules = [...prev];
      newSchedules[index] = { ...newSchedules[index], day };
      return newSchedules;
    });
  }, []);

  const handleSchedulePeriodChange = useCallback((index: number, period: string) => {
    setSchedules((prev) => {
      const newSchedules = [...prev];
      newSchedules[index] = { ...newSchedules[index], period };
      return newSchedules;
    });
  }, []);

  const periodCount = useMemo(() => {
    return parseInt(period, 10) || 0;
  }, [period]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) {
      return students;
    }
    const query = searchQuery.toLowerCase().trim();
    return students.filter(
      (student) =>
        student.name?.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const toggleStudent = useCallback((studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      setValidationError(null);

      // 학반명 검증
      if (!className.trim()) {
        setValidationError("학반명을 입력해주세요.");
        return;
      }

      // 차시 검증
      const periodNum = parseInt(period, 10);
      if (!period || isNaN(periodNum) || periodNum < 1) {
        setValidationError("차시를 올바르게 입력해주세요.");
        return;
      }

      // 스케줄 검증 - 모든 차시에 요일과 교시가 입력되어야 함
      if (schedules.length !== periodNum) {
        setValidationError("차시 개수와 스케줄 개수가 일치하지 않습니다.");
        return;
      }

      const incompleteSchedules = schedules.filter(
        (schedule) => !schedule.day || !schedule.period
      );
      if (incompleteSchedules.length > 0) {
        setValidationError("모든 차시의 요일과 교시를 입력해주세요.");
        return;
      }

      // 수강생 검증
      if (selectedStudentIds.size === 0) {
        setValidationError("최소 1명 이상의 수강생을 선택해주세요.");
        return;
      }

      setIsSubmitting(true);
      
      try {
        // API를 통해 MongoDB에 학반 정보 수정
        const response = await fetch(
          `/api/courses/${courseId}/class-groups/${classGroup.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: className.trim(),
              period: period.trim() || null,
              schedules: schedules.filter((s) => s.day && s.period),
              studentIds: Array.from(selectedStudentIds),
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          setValidationError(
            errorData.error || "학반 수정 중 오류가 발생했습니다."
          );
          return;
        }

        // 이벤트 발생으로 다른 컴포넌트에 알림
        window.dispatchEvent(
          new CustomEvent("course:classGroups:updated", {
            detail: { courseId },
          })
        );

        handleClose();
        onUpdated?.();
      } catch (error) {
        console.error("학반 수정 실패:", error);
        setValidationError("학반 수정 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [className, period, schedules, courseId, classGroup.id, selectedStudentIds, handleClose, onUpdated]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">학반 수정</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4 flex flex-col flex-1 overflow-hidden">
          {validationError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{validationError}</p>
            </div>
          )}
          
          <div>
            <label
              htmlFor="editClassName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              학반명 <span className="text-red-500">*</span>
            </label>
            <Input
              id="editClassName"
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="예: 1반, 2반, A반 등"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              차시별 요일 및 교시 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <label
                  htmlFor="editPeriod"
                  className="block text-xs text-gray-600 mb-1"
                >
                  차시
                </label>
                <Input
                  id="editPeriod"
                  type="number"
                  min="1"
                  value={period}
                  onChange={handlePeriodChange}
                  placeholder="차시"
                  className="w-20"
                />
              </div>
              
              {periodCount > 0 && (
                <div className="flex-1 overflow-y-auto max-h-64">
                  <div className="space-y-2">
                    {schedules.map((schedule, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2"
                      >
                        <span className="text-xs font-medium text-gray-700 min-w-[2.5rem]">
                          {index + 1}차시
                        </span>
                        <Select
                          options={daysOfWeek}
                          value={schedule.day}
                          onChange={(e) =>
                            handleScheduleDayChange(index, e.target.value)
                          }
                          className="flex-1"
                        />
                        <Select
                          options={[
                            { value: "", label: "교시 선택" },
                            ...periods,
                          ]}
                          value={schedule.period}
                          onChange={(e) =>
                            handleSchedulePeriodChange(index, e.target.value)
                          }
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                수강생 추가하기 <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="mb-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="학생 이름 또는 이메일로 검색..."
                className="w-full"
              />
            </div>
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md">
              {students.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  학생 계정이 없습니다.
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name ?? "이름 없음"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {student.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {students.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                {selectedStudentIds.size}명 선택됨
                {searchQuery && (
                  <span className="ml-2">
                    ({filteredStudents.length}명 검색됨)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !className.trim()}
              isLoading={isSubmitting}
            >
              수정
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

