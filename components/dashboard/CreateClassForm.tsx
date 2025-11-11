"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/providers/ToastProvider";

const formSchema = z.object({
  subject: z
    .string()
    .min(1, "교과명을 입력하세요")
    .max(50, "교과명은 50자 이하여야 합니다"),
  grade: z
    .string()
    .min(1, "대상 학년을 선택하세요"),
  classroom: z
    .string()
    .min(1, "강의실을 입력하세요")
    .max(50, "강의실은 50자 이하여야 합니다"),
});

type FormValues = z.infer<typeof formSchema>;

const gradeOptions = [
  { value: "", label: "대상 학년 선택" },
  { value: "1", label: "1학년" },
  { value: "2", label: "2학년" },
  { value: "3", label: "3학년" },
];

type CreateClassFormProps = {
  instructorName: string;
  onSuccess?: () => void;
  onCreated?: (course: {
    id: string;
    subject: string;
    grade: string;
    instructor: string;
    classroom: string;
    createdAt: string;
  }) => void;
};

export default function CreateClassForm({
  instructorName,
  onSuccess,
  onCreated,
}: CreateClassFormProps) {
  const { showToast } = useToastContext();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      grade: "",
      classroom: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        instructor: instructorName,
      };

      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          responseBody?.error ??
          "수업 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        throw new Error(errorMessage);
      }

      if (responseBody?.class) {
        onCreated?.(responseBody.class);
      }

      showToast("수업이 생성되었습니다.", "success");
      reset({
        subject: "",
        grade: "",
        classroom: "",
      });
      onSuccess?.();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "수업 생성 중 오류가 발생했습니다.";
      showToast(message, "error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6"
      noValidate
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          {...register("subject")}
          label="교과명"
          placeholder="예: 수학 심화"
          error={errors.subject?.message}
          aria-required="true"
        />
        <Select
          {...register("grade")}
          label="대상 학년"
          options={gradeOptions}
          error={errors.grade?.message}
          aria-required="true"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          value={instructorName}
          label="강사명"
          readOnly
          aria-readonly="true"
          tabIndex={-1}
        />
        <Input
          {...register("classroom")}
          label="강의실"
          placeholder="예: 본관 3층 305호"
          error={errors.classroom?.message}
          aria-required="true"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            reset({ subject: "", grade: "", classroom: "" })
          }
        >
          초기화
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          수업 생성하기
        </Button>
      </div>
    </form>
  );
}

