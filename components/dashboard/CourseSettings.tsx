"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/providers/ToastProvider";

type CourseSettingsProps = {
  courseId: string;
  courseName: string;
};

export default function CourseSettings({
  courseId,
  courseName,
}: CourseSettingsProps) {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `"${courseName}" 수업을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/classes/${courseId}`, {
        method: "DELETE",
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          body?.error ?? "수업 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        throw new Error(errorMessage);
      }

      showToast("수업이 삭제되었습니다.", "success");
      router.push("/dashboard/teacher/manage-classes");
      router.refresh();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "수업 삭제 중 오류가 발생했습니다.";
      showToast(message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-red-200 bg-red-50 p-6">
        <header className="space-y-1">
          <h3 className="text-lg font-semibold text-red-700">위험 구역</h3>
          <p className="text-sm text-red-600">
            수업을 삭제하면 관련된 과제나 출결 기록 등이 함께 삭제될 수 있습니다. 삭제
            후에는 되돌릴 수 없습니다.
          </p>
        </header>

        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-white p-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">수업 삭제</h4>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{courseName}</span>{" "}
              수업과 관련된 데이터를 완전히 삭제합니다.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="border-red-200 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
          >
            수업 삭제
          </Button>
        </div>
      </section>
    </div>
  );
}


