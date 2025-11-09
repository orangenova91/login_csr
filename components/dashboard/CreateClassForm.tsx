"use client";

import { useEffect } from "react";
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
  instructor: z
    .string()
    .min(1, "강사명을 입력하세요")
    .max(50, "강사명은 50자 이하여야 합니다"),
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

export default function CreateClassForm({
  instructorName,
}: {
  instructorName: string;
}) {
  const { showToast } = useToastContext();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      grade: "",
      instructor: instructorName,
      classroom: "",
    },
  });

  useEffect(() => {
    setValue("instructor", instructorName);
  }, [instructorName, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      // TODO: API 연동
      console.log("create class payload", values);
      showToast("수업이 임시로 저장되었습니다. 곧 API와 연동하세요.", "success");
      reset({ ...values, instructor: instructorName });
    } catch (error) {
      console.error(error);
      showToast("수업 생성 중 오류가 발생했습니다.", "error");
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
          {...register("instructor")}
          label="강사명"
          placeholder="담당 교사를 입력하세요"
          error={errors.instructor?.message}
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

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => reset({ instructor: instructorName, subject: "", grade: "", classroom: "" })}>
          초기화
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          수업 생성하기
        </Button>
      </div>
    </form>
  );
}

