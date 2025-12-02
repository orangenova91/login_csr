"use client";
import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateAdminSchema, type UpdateAdminInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToastContext } from "@/components/providers/ToastProvider";
import { Plus, X, Eye, EyeOff } from "lucide-react";

type Admin = {
  id: string;
  email: string;
  name: string | null;
  school: string | null;
  createdAt: Date;
  adminProfile: {
    phoneNumber: string | null;
    school: {
      id: string;
      name: string;
      schoolType: string;
      contactName: string;
      contactPhone: string;
      totalClasses: number | null;
      totalStudents: number | null;
      status: string;
      createdAt: Date;
    } | null;
  } | null;
};

type EditAdminFormProps = {
  admin: Admin;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function EditAdminForm({ admin, onSuccess, onCancel }: EditAdminFormProps) {
  const { showToast } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 기존 데이터에서 gradeInfo 파싱
  const getExistingGradeInfo = () => {
    try {
      if (admin.adminProfile?.school?.gradeInfo) {
        const parsed = JSON.parse(admin.adminProfile.school.gradeInfo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("gradeInfo 파싱 오류:", error);
    }
    return [{ grade: "", classCount: 0, studentCount: 0 }];
  };

  const existingGradeInfo = getExistingGradeInfo();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<UpdateAdminInput>({
    resolver: zodResolver(updateAdminSchema),
    defaultValues: {
      adminId: admin.id,
      schoolName: admin.adminProfile?.school?.name || admin.school || "",
      schoolType: (admin.adminProfile?.school?.schoolType as "초등학교" | "중학교" | "고등학교" | "대학교" | "기타") || "",
      adminName: admin.name || "",
      adminEmail: admin.email,
      adminPassword: "",
      contactName: admin.adminProfile?.school?.contactName || "",
      contactPhone: admin.adminProfile?.school?.contactPhone || admin.adminProfile?.phoneNumber || "",
      gradeInfo: existingGradeInfo,
      status: (admin.adminProfile?.school?.status as "active" | "inactive" | "suspended") || "active",
      notes: admin.adminProfile?.school?.notes || admin.adminProfile?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "gradeInfo",
  });

  // admin prop이 변경될 때 폼 값 업데이트
  useEffect(() => {
    const gradeInfo = getExistingGradeInfo();
    reset({
      adminId: admin.id,
      schoolName: admin.adminProfile?.school?.name || admin.school || "",
      schoolType: (admin.adminProfile?.school?.schoolType as "초등학교" | "중학교" | "고등학교" | "대학교" | "기타") || "",
      adminName: admin.name || "",
      adminEmail: admin.email,
      adminPassword: "",
      contactName: admin.adminProfile?.school?.contactName || "",
      contactPhone: admin.adminProfile?.school?.contactPhone || admin.adminProfile?.phoneNumber || "",
      gradeInfo: gradeInfo,
      status: (admin.adminProfile?.school?.status as "active" | "inactive" | "suspended") || "active",
      notes: admin.adminProfile?.school?.notes || admin.adminProfile?.notes || "",
    });
  }, [admin, reset]);

  const onSubmit = async (data: UpdateAdminInput) => {
    setIsSubmitting(true);
    try {
      // 비밀번호가 빈 문자열이면 undefined로 변환
      const submitData = {
        ...data,
        adminPassword: data.adminPassword && data.adminPassword.trim() !== "" ? data.adminPassword : undefined,
      };

      const response = await fetch("/api/admin/update-admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "Admin 계정 수정에 실패했습니다.", "error");
        return;
      }

      showToast("Admin 계정이 성공적으로 수정되었습니다.", "success");
      onSuccess?.();
    } catch (error) {
      showToast("Admin 계정 수정 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addGradeInfo = () => {
    append({ grade: "", classCount: 0, studentCount: 0 });
  };

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
              { value: "", label: "학교 구분 선택" },
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
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">학년 {index + 1}</h4>
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

            <div className="grid grid-cols-3 gap-3">
              <Input
                {...register(`gradeInfo.${index}.grade` as const)}
                type="text"
                label="학년"
                error={errors.gradeInfo?.[index]?.grade?.message}
                placeholder="예: 1학년"
                aria-required="true"
              />

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
              />
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
              비밀번호 (변경하지 않으려면 비워두세요)
            </label>
            <div className="relative">
              <input
                {...register("adminPassword")}
                id="adminPassword"
                type={showPassword ? "text" : "password"}
                placeholder="최소 8자, 소문자와 숫자 포함"
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
        <Select
          {...register("status")}
          label="상태"
          error={errors.status?.message}
          options={[
            { value: "active", label: "활성" },
            { value: "inactive", label: "비활성" },
            { value: "suspended", label: "정지" },
          ]}
          aria-required="true"
        />

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
          {isSubmitting ? "수정 중..." : "수정 완료"}
        </Button>
      </div>
    </form>
  );
}

