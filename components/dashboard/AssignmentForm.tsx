"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/providers/ToastProvider";

const assignmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력하세요")
    .max(200, "제목은 200자 이하여야 합니다"),
  description: z
    .string()
    .trim()
    .max(5000, "설명은 5000자 이하여야 합니다")
    .optional(),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentFormProps {
  courseId: string;
  assignmentId?: string;
  initialData?: {
    title: string;
    description: string | null;
    dueDate: string | null;
    originalFileName: string | null;
    filePath: string | null;
  };
  onSuccess?: () => void;
}

export default function AssignmentForm({
  courseId,
  assignmentId,
  initialData,
  onSuccess,
}: AssignmentFormProps) {
  const { showToast } = useToastContext();
  const [files, setFiles] = useState<File[]>([]);
  const [removeFiles, setRemoveFiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!assignmentId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const tooLarge = selectedFiles.find((f) => f.size > maxSize);
      if (tooLarge) {
        showToast("파일 크기는 50MB 이하여야 합니다.", "error");
        return;
      }
      setFiles(selectedFiles);
    }
  };

  const onSubmit = async (values: AssignmentFormValues) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("title", values.title);
      if (values.description) {
        formData.append("description", values.description);
      }
      if (files.length > 0) {
        files.forEach((f) => formData.append("files", f));
      }
      if (removeFiles) {
        formData.append("removeFile", "true");
      }

      const url = isEditMode
        ? `/api/courses/${courseId}/assignments/${assignmentId}`
        : `/api/courses/${courseId}/assignments`;

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        body: formData,
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          responseBody?.error ??
          (isEditMode
            ? "과제 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            : "과제 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        throw new Error(errorMessage);
      }

      showToast(
        isEditMode ? "과제가 수정되었습니다." : "과제가 생성되었습니다.",
        "success"
      );
      reset();
      setFiles([]);
      setRemoveFiles(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : isEditMode
          ? "과제 수정 중 오류가 발생했습니다."
          : "과제 생성 중 오류가 발생했습니다.";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div>
        <Input
          {...register("title")}
          label="과제 제목"
          placeholder="예: 1주차 수학 과제"
          error={errors.title?.message}
          aria-required="true"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          설명 (선택)
        </label>
        <textarea
          {...register("description")}
          id="description"
          rows={4}
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="과제에 대한 설명을 입력하세요..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-1">
        <div>
          <label
            htmlFor="files"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            첨부 파일 (선택, 여러 개 가능)
          </label>
          <input
            id="files"
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".ppt,.pptx,.pdf,.doc,.docx,.xls,.xlsx,.zip,.hwp,.hwpx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          />
          {files.length > 0 && (
            <ul className="mt-1 text-sm text-gray-600 list-disc pl-4 space-y-0.5">
              {files.map((f) => (
                <li key={f.name}>
                  {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          )}
          {isEditMode && !files.length && initialData?.originalFileName && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
              <span className="text-sm text-gray-600 flex-1">
                현재 파일: {initialData.originalFileName}
              </span>
              <button
                type="button"
                onClick={() => setRemoveFiles(!removeFiles)}
                className={`text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded px-2 py-1 ${
                  removeFiles
                    ? "text-blue-600 hover:text-blue-700 focus-visible:ring-blue-500"
                    : "text-red-600 hover:text-red-700 focus-visible:ring-red-500"
                }`}
              >
                {removeFiles ? "삭제 취소" : "파일 삭제"}
              </button>
            </div>
          )}
          {removeFiles && (
            <p className="mt-1 text-sm text-red-600">
              기존 첨부 파일이 모두 삭제됩니다. 새 파일을 선택하거나 취소하려면 파일 삭제를 다시 클릭하세요.
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            허용 형식: PPT, PPTX, PDF, DOC, DOCX, XLS, XLSX, ZIP, HWP, HWPX, JPG, PNG, GIF, BMP, WEBP, SVG (파일당 최대 50MB)
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setFiles([]);
            setRemoveFiles(false);
          }}
        >
          초기화
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditMode ? "과제 수정하기" : "과제 생성하기"}
        </Button>
      </div>
    </form>
  );
}

