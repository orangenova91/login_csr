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
    attachments?: {
      filePath: string;
      originalFileName: string;
      fileSize: number | null;
      mimeType: string | null;
    }[];
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
  const [existingAttachments, setExistingAttachments] = useState<
    {
      id?: string;
      filePath: string;
      originalFileName: string;
      fileSize: number | null;
      mimeType: string | null;
    }[]
  >(() => {
    const list =
      initialData?.attachments && initialData.attachments.length > 0
        ? initialData.attachments
        : (initialData?.originalFileName && initialData?.filePath
            ? [
                {
                  filePath: initialData.filePath,
                  originalFileName: initialData.originalFileName,
                  fileSize: null,
                  mimeType: null,
                },
              ]
            : []);
    return list;
  });
  const [removeFiles, setRemoveFiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
            ? "자료 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            : "자료 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        throw new Error(errorMessage);
      }

      showToast(isEditMode ? "자료가 수정되었습니다." : "자료가 생성되었습니다.", "success");
      reset();
      setFiles([]);
      setRemoveFiles(false);
      setExistingAttachments([]);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : isEditMode
          ? "자료 수정 중 오류가 발생했습니다."
          : "자료 생성 중 오류가 발생했습니다.";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (att: {
    id?: string;
    filePath: string;
    originalFileName: string;
  }) => {
    if (!isEditMode || !assignmentId) return;
    if (!att.id) {
      showToast("이 첨부는 개별 삭제를 지원하지 않습니다.", "error");
      return;
    }
    const confirmed = window.confirm(
      `"${att.originalFileName}" 파일을 삭제하시겠습니까?`
    );
    if (!confirmed) return;
    try {
      setDeletingId(att.id);
      const res = await fetch(
        `/api/courses/${courseId}/assignments/${assignmentId}/attachments/${att.id}`,
        { method: "DELETE" }
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || "첨부 삭제에 실패했습니다.");
      }
      setExistingAttachments((prev) =>
        prev.filter((a) => a.id !== att.id)
      );
      showToast("첨부가 삭제되었습니다.", "success");
    } catch (e) {
      console.error(e);
      showToast(
        e instanceof Error ? e.message : "첨부 삭제 중 오류가 발생했습니다.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div>
        <Input
          {...register("title")}
          label="자료 제목"
          placeholder="예: 1주차 수업 자료"
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
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="자료에 대한 설명을 입력하세요..."
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
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 placeholder:text-gray-500"
          />
          {files.length > 0 && (
            <ul className="mt-2 text-sm text-gray-700 space-y-1">
              {files.map((f, idx) => (
                <li
                  key={`${f.name}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white px-2 py-1"
                >
                  <span className="truncate">
                    {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelectedFile(idx)}
                    className="flex-shrink-0 text-xs text-red-600 hover:text-red-700 rounded px-2 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
          {isEditMode && (existingAttachments.length > 0) && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">현재 첨부 파일</span>
                <button
                  type="button"
                  onClick={() => setRemoveFiles(!removeFiles)}
                  className={`text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded px-2 py-1 ${
                    removeFiles
                      ? "text-blue-600 hover:text-blue-700 focus-visible:ring-blue-500"
                      : "text-red-600 hover:text-red-700 focus-visible:ring-red-500"
                  }`}
                >
                  {removeFiles ? "삭제 취소" : "모든 첨부 삭제"}
                </button>
              </div>
              <ul className="text-sm text-gray-600 pl-1 space-y-1">
                {existingAttachments.map((att, idx) => (
                  <li key={`${att.filePath}-${idx}`} className="flex items-center justify-between gap-2 break-all rounded border border-gray-200 bg-white px-2 py-1">
                    <span className="truncate">{att.originalFileName}</span>
                    <button
                      type="button"
                      disabled={!att.id || deletingId === att.id}
                      onClick={() => handleDeleteAttachment(att as any)}
                      className="flex-shrink-0 text-xs text-red-600 hover:text-red-700 disabled:opacity-50 rounded px-2 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    >
                      {deletingId === att.id ? "삭제 중..." : "삭제"}
                    </button>
                  </li>
                ))}
              </ul>
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
          {isEditMode ? "자료 수정하기" : "자료 생성하기"}
        </Button>
      </div>
    </form>
  );
}

