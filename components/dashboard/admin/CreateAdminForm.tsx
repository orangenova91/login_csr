"use client";
import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdminSchema, type CreateAdminInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToastContext } from "@/components/providers/ToastProvider";
import { Plus, X, Eye, EyeOff } from "lucide-react";

type CreateAdminFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function CreateAdminForm({ onSuccess, onCancel }: CreateAdminFormProps) {
  const { showToast } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateAdminInput>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      schoolName: "",
      schoolType: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      contactName: "",
      contactPhone: "",
      gradeInfo: [{ grade: "", classCount: 0, studentCount: 0 }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "gradeInfo",
  });

  // 학교 구분 값 감시
  const schoolType = watch("schoolType");

  const onSubmit = async (data: CreateAdminInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "Admin 계정 생성에 실패했습니다.", "error");
        return;
      }

      showToast("Admin 계정이 성공적으로 생성되었습니다.", "success");
      reset();
      onSuccess?.();
    } catch (error) {
      showToast("Admin 계정 생성 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addGradeInfo = () => {
    append({ grade: "", classCount: 0, studentCount: 0 });
  };

  // 학교 구분에 따른 학년 옵션 생성 (useMemo로 최적화)
  const gradeOptions = useMemo(() => {
    if (!schoolType || schoolType === "" || schoolType === "기타") {
      return null; // 기타이거나 선택되지 않은 경우 null 반환 (텍스트 입력)
    }

    let maxGrade = 0;
    switch (schoolType) {
      case "초등학교":
        maxGrade = 6;
        break;
      case "중학교":
      case "고등학교":
        maxGrade = 3;
        break;
      case "대학교":
        maxGrade = 4;
        break;
      default:
        return null;
    }

    return Array.from({ length: maxGrade }, (_, i) => ({
      value: `${i + 1}학년`,
      label: `${i + 1}학년`,
    }));
  }, [schoolType]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">학교 정보</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <Select
            {...register("schoolType", { required: true })}
            label="학교 구분"
            error={errors.schoolType?.message}
            options={[
              { value: "", label: "선택" },
              { value: "초등학교", label: "초등학교" },
              { value: "중학교", label: "중학교" },
              { value: "고등학교", label: "고등학교" },
              { value: "대학교", label: "대학교" },
              { value: "기타", label: "기타" },
            ]}
            aria-required="true"
          />

          <Input
            {...register("schoolName")}
            type="text"
            label="학교 이름"
            error={errors.schoolName?.message}
            placeholder="예: 서울초등학교"
            aria-required="true"
          />

          <Input
            {...register("adminName")}
            type="text"
            label="계정 이름"
            error={errors.adminName?.message}
            placeholder="예: 이관리"
            aria-required="true"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">학년별 정보</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGradeInfo}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            학년 추가
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
          >
            <div className="grid grid-cols-3 gap-3">
              {gradeOptions ? (
                <Select
                  {...register(`gradeInfo.${index}.grade` as const)}
                  label="학년"
                  error={errors.gradeInfo?.[index]?.grade?.message}
                  options={[
                    { value: "", label: "학년 선택" },
                    ...gradeOptions,
                  ]}
                  aria-required="true"
                />
              ) : (
                <Input
                  {...register(`gradeInfo.${index}.grade` as const)}
                  type="text"
                  label="학년"
                  error={errors.gradeInfo?.[index]?.grade?.message}
                  placeholder="예: 1학년"
                  aria-required="true"
                />
              )}

              <Input
                {...register(`gradeInfo.${index}.classCount` as const, {
                  valueAsNumber: true,
                })}
                type="number"
                label="학급수"
                error={errors.gradeInfo?.[index]?.classCount?.message}
                placeholder="0"
                min="0"
                aria-required="true"
              />

              <div className="flex items-end gap-2">
                <Input
                  {...register(`gradeInfo.${index}.studentCount` as const, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  label="학생수"
                  error={errors.gradeInfo?.[index]?.studentCount?.message}
                  placeholder="0"
                  min="0"
                  aria-required="true"
                  className="flex-1"
                />
                <div className="w-[42px] mb-1">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {errors.gradeInfo && typeof errors.gradeInfo.message === "string" && (
          <p className="text-sm text-red-600">{errors.gradeInfo.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">스쿨허브 담당자 정보</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <Input
            {...register("contactName")}
            type="text"
            label="스쿨허브 담당자 이름"
            error={errors.contactName?.message}
            placeholder="예: 홍길동"
            aria-required="true"
          />

          <Input
            {...register("contactPhone")}
            type="tel"
            label="담당자 전화번호"
            error={errors.contactPhone?.message}
            placeholder="예: 010-1234-5678"
            aria-required="true"
          />

          <Input
            {...register("adminEmail")}
            type="email"
            label="담당자 이메일"
            error={errors.adminEmail?.message}
            placeholder="예: admin@school.com"
            aria-required="true"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Admin 계정 정보</h3>

        <div className="relative">
          <div className="w-full">
            <label
              htmlFor="adminPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호
              <span className="ml-1 text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("adminPassword")}
                id="adminPassword"
                type={showPassword ? "text" : "password"}
                placeholder="최소 8자, 소문자와 숫자 포함"
                aria-required="true"
                className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm ring-offset-white placeholder:text-gray-400 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.adminPassword?.message && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.adminPassword.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          {...register("notes")}
          type="text"
          label="메모 (선택사항)"
          error={errors.notes?.message}
          placeholder="추가 정보나 메모를 입력하세요"
        />
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "생성 중..." : "Admin 계정 생성"}
        </Button>
      </div>
    </form>
  );
}

