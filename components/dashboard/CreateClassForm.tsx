"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/providers/ToastProvider";

const formSchema = z.object({
  academicYear: z
    .string()
    .trim()
    .min(1, "학년도를 입력하세요")
    .max(9, "학년도가 너무 깁니다 (예: 2025)"),
  semester: z
    .string()
    .trim()
    .min(1, "학기를 선택하세요"),
  subjectGroup: z
    .string()
    .trim()
    .min(1, "교과군을 입력하세요")
    .max(50, "교과군은 50자 이하여야 합니다"),
  subjectArea: z
    .string()
    .trim()
    .min(1, "교과영역을 입력하세요")
    .max(50, "교과영역은 50자 이하여야 합니다"),
  careerTrack: z
    .string()
    .trim()
    .min(1, "진로구분을 입력하세요")
    .max(50, "진로구분은 50자 이하여야 합니다"),
  subject: z
    .string()
    .trim()
    .min(1, "교과명을 입력하세요")
    .max(50, "교과명은 50자 이하여야 합니다"),
  grade: z
    .string()
    .trim()
    .min(1, "대상 학년을 선택하세요"),
  classroom: z
    .string()
    .trim()
    .min(1, "강의실을 입력하세요")
    .max(50, "강의실은 50자 이하여야 합니다"),
  description: z
    .string()
    .trim()
    .min(1, "강의소개를 입력하세요")
    .max(1000, "강의소개는 1000자 이하여야 합니다"),
});

type FormValues = z.infer<typeof formSchema>;

const gradeOptions = [
  { value: "", label: "대상 학년 선택" },
  { value: "1", label: "1학년" },
  { value: "2", label: "2학년" },
  { value: "3", label: "3학년" },
];

const semesterOptions = [
  { value: "", label: "학기 선택" },
  { value: "1학기", label: "1학기" },
  { value: "2학기", label: "2학기" },
];

type CreateClassFormProps = {
  instructorName: string;
  onSuccess?: () => void;
  onCreated?: (course: {
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
      academicYear: "",
      semester: "",
      subjectGroup: "",
      subjectArea: "",
      careerTrack: "",
      subject: "",
      grade: "",
      classroom: "",
      description: "",
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
        academicYear: "",
        semester: "",
        subjectGroup: "",
        subjectArea: "",
        careerTrack: "",
        subject: "",
        grade: "",
        classroom: "",
        description: "",
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
          {...register("academicYear")}
          label="학년도"
          placeholder="예: 2025"
          error={errors.academicYear?.message}
          aria-required="true"
        />
        <Select
          {...register("semester")}
          label="학기"
          options={semesterOptions}
          error={errors.semester?.message}
          aria-required="true"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          {...register("subjectGroup")}
          label="교과군"
          placeholder="예: 수학"
          error={errors.subjectGroup?.message}
          aria-required="true"
        />
        <Input
          {...register("subjectArea")}
          label="교과영역"
          placeholder="예: 대수"
          error={errors.subjectArea?.message}
          aria-required="true"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          {...register("careerTrack")}
          label="진로구분"
          placeholder="예: 인문계"
          error={errors.careerTrack?.message}
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
          {...register("subject")}
          label="교과명"
          placeholder="예: 수학 심화"
          error={errors.subject?.message}
          aria-required="true"
        />
        <Input
          {...register("classroom")}
          label="강의실"
          placeholder="예: 본관 3층 305호"
          error={errors.classroom?.message}
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
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          강의소개 <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("description")}
          id="description"
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          placeholder="수업에 대한 간단한 소개를 입력하세요."
          aria-required="true"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            reset({
              academicYear: "",
              semester: "",
              subjectGroup: "",
              subjectArea: "",
              careerTrack: "",
              subject: "",
              grade: "",
              classroom: "",
              description: "",
            })
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

