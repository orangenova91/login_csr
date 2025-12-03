"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStudentProfileSchema, type UpdateStudentProfileInput } from "@/lib/validations/student";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/providers/ToastProvider";

interface ProfileFormProps {
  initialData?: {
    user?: {
      id: string;
      email: string;
      name?: string | null;
      school?: string | null;
      region?: string | null;
      role?: string | null;
    };
    profile?: any;
  };
  onSuccess?: () => void;
}

export default function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateStudentProfileInput>({
    resolver: zodResolver(updateStudentProfileSchema),
    defaultValues: {
      name: initialData?.user?.name || "",
      school: initialData?.user?.school || "",
      region: initialData?.user?.region || "",
      studentId: initialData?.profile?.studentId || "",
      grade: initialData?.profile?.grade || "",
      classLabel: initialData?.profile?.classLabel || "",
      section: initialData?.profile?.section || "",
      seatNumber: initialData?.profile?.seatNumber || "",
      major: initialData?.profile?.major || "",
      sex: initialData?.profile?.sex || "",
      classOfficer: initialData?.profile?.classOfficer || "",
      specialEducation: initialData?.profile?.specialEducation || "",
      phoneNumber: initialData?.profile?.phoneNumber || "",
      siblings: initialData?.profile?.siblings || "",
      academicStatus: initialData?.profile?.academicStatus || "",
      remarks: initialData?.profile?.remarks || "",
      club: initialData?.profile?.club || "",
      clubTeacher: initialData?.profile?.clubTeacher || "",
      clubLocation: initialData?.profile?.clubLocation || "",
      dateOfBirth: initialData?.profile?.dateOfBirth || "",
      address: initialData?.profile?.address || "",
      residentRegistrationNumber: initialData?.profile?.residentRegistrationNumber || "",
      motherName: initialData?.profile?.motherName || "",
      motherPhone: initialData?.profile?.motherPhone || "",
      motherRemarks: initialData?.profile?.motherRemarks || "",
      fatherName: initialData?.profile?.fatherName || "",
      fatherPhone: initialData?.profile?.fatherPhone || "",
      fatherRemarks: initialData?.profile?.fatherRemarks || "",
      electiveSubjects: initialData?.profile?.electiveSubjects || [],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData?.user?.name || "",
        school: initialData?.user?.school || "",
        region: initialData?.user?.region || "",
        studentId: initialData?.profile?.studentId || "",
        grade: initialData?.profile?.grade || "",
        classLabel: initialData?.profile?.classLabel || "",
        section: initialData?.profile?.section || "",
        seatNumber: initialData?.profile?.seatNumber || "",
        major: initialData?.profile?.major || "",
        sex: initialData?.profile?.sex || "",
        classOfficer: initialData?.profile?.classOfficer || "",
        specialEducation: initialData?.profile?.specialEducation || "",
        phoneNumber: initialData?.profile?.phoneNumber || "",
        siblings: initialData?.profile?.siblings || "",
        academicStatus: initialData?.profile?.academicStatus || "",
        remarks: initialData?.profile?.remarks || "",
        club: initialData?.profile?.club || "",
        clubTeacher: initialData?.profile?.clubTeacher || "",
        clubLocation: initialData?.profile?.clubLocation || "",
        dateOfBirth: initialData?.profile?.dateOfBirth || "",
        address: initialData?.profile?.address || "",
        residentRegistrationNumber: initialData?.profile?.residentRegistrationNumber || "",
        motherName: initialData?.profile?.motherName || "",
        motherPhone: initialData?.profile?.motherPhone || "",
        motherRemarks: initialData?.profile?.motherRemarks || "",
        fatherName: initialData?.profile?.fatherName || "",
        fatherPhone: initialData?.profile?.fatherPhone || "",
        fatherRemarks: initialData?.profile?.fatherRemarks || "",
        electiveSubjects: initialData?.profile?.electiveSubjects || [],
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: UpdateStudentProfileInput) => {
    setIsLoading(true);
    try {
      // 빈 문자열을 null로 변환
      const cleanedData: any = {};
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof UpdateStudentProfileInput];
        if (value === "" || (Array.isArray(value) && value.length === 0)) {
          cleanedData[key] = null;
        } else {
          cleanedData[key] = value;
        }
      });

      const response = await fetch("/api/student/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "프로필 업데이트 중 오류가 발생했습니다.", "error");
        return;
      }

      showToast("프로필이 성공적으로 업데이트되었습니다.", "success");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showToast("프로필 업데이트 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* 기본 정보 섹션 */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register("region")}
            type="text"
            label="지역"
            error={errors.region?.message}
            readOnly
          />
            <Input
              {...register("school")}
              type="text"
              label="학교"
              error={errors.school?.message}
              autoComplete="organization"
              readOnly
            />
            <Input
              {...register("studentId")}
              type="text"
              label="학번"
              error={errors.studentId?.message}
              readOnly
            />
          <Input
            {...register("name")}
            type="text"
            label="이름"
            error={errors.name?.message}
            autoComplete="name"
            readOnly
          />
        </div>
      </section>

      {/* 학생 정보 섹션 */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">학생 정보</h2>
        {/* 학년, 반, 번호, 학반 필드는 숨김 처리 */}
        <div className="hidden">
          <Input
            {...register("grade")}
            type="text"
            label="학년"
            error={errors.grade?.message}
          />
          <Input
            {...register("section")}
            type="text"
            label="반"
            error={errors.section?.message}
          />
          <Input
            {...register("seatNumber")}
            type="text"
            label="번호"
            error={errors.seatNumber?.message}
          />
          <Input
            {...register("classLabel")}
            type="text"
            label="학반"
            error={errors.classLabel?.message}
          />
        </div>
        {/* 학적상태, 성별, 전화번호, 이메일을 한 줄에 배치 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Input
            {...register("academicStatus")}
            type="text"
            label="학적상태"
            error={errors.academicStatus?.message}
            readOnly
          />
          <Select
            {...register("sex")}
            label="성별"
            error={errors.sex?.message}
            disabled
            options={[
              { value: "", label: "선택하세요" },
              { value: "남", label: "남" },
              { value: "여", label: "여" },
            ]}
          />
          <Input
            {...register("phoneNumber")}
            type="tel"
            label="전화번호"
            error={errors.phoneNumber?.message}
            autoComplete="tel"
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={initialData?.user?.email || ""}
              readOnly
              className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register("classOfficer")}
            type="text"
            label="학급직"
            error={errors.classOfficer?.message}
            readOnly
          />
          <Input
            {...register("major")}
            type="text"
            label="희망전공"
            error={errors.major?.message}
          />
            <Input
              {...register("siblings")}
              type="text"
              label="형제관계"
              error={errors.siblings?.message}
              readOnly
            />
          <Input
            {...register("specialEducation")}
            type="text"
            label="특수교육 여부"
            error={errors.specialEducation?.message}
            readOnly
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비고
          </label>
          <textarea
            {...register("remarks")}
            rows={3}
            className={`flex w-full rounded-md border px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.remarks ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300"
            }`}
          />
          {errors.remarks && (
            <p className="mt-1 text-sm text-red-600">{errors.remarks.message}</p>
          )}
        </div>
      </section>

      {/* 동아리 정보 섹션 */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">동아리 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register("club")}
            type="text"
            label="동아리"
            error={errors.club?.message}
          />
          <Input
            {...register("clubTeacher")}
            type="text"
            label="동아리 담당교사"
            error={errors.clubTeacher?.message}
          />
          <Input
            {...register("clubLocation")}
            type="text"
            label="동아리 장소"
            error={errors.clubLocation?.message}
          />
        </div>
      </section>

      {/* 개인 정보 섹션 */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">개인 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register("dateOfBirth")}
            type="text"
            label="생년월일"
            error={errors.dateOfBirth?.message}
            placeholder="YYYY-MM-DD"
          />
          <Input
            {...register("address")}
            type="text"
            label="주소"
            error={errors.address?.message}
            autoComplete="street-address"
          />
          <Input
            {...register("residentRegistrationNumber")}
            type="text"
            label="주민등록번호"
            error={errors.residentRegistrationNumber?.message}
          />
        </div>
      </section>

      {/* 가족 정보 섹션 */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">가족 정보</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">어머니</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register("motherName")}
                type="text"
                label="이름"
                error={errors.motherName?.message}
              />
              <Input
                {...register("motherPhone")}
                type="tel"
                label="전화번호"
                error={errors.motherPhone?.message}
                autoComplete="tel"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비고
              </label>
              <textarea
                {...register("motherRemarks")}
                rows={2}
                className="flex w-full rounded-md border border-gray-300 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.motherRemarks && (
                <p className="mt-1 text-sm text-red-600">{errors.motherRemarks.message}</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">아버지</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register("fatherName")}
                type="text"
                label="이름"
                error={errors.fatherName?.message}
              />
              <Input
                {...register("fatherPhone")}
                type="tel"
                label="전화번호"
                error={errors.fatherPhone?.message}
                autoComplete="tel"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비고
              </label>
              <textarea
                {...register("fatherRemarks")}
                rows={2}
                className="flex w-full rounded-md border border-gray-300 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.fatherRemarks && (
                <p className="mt-1 text-sm text-red-600">{errors.fatherRemarks.message}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 제출 버튼 */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
        >
          저장하기
        </Button>
      </div>
    </form>
  );
}

