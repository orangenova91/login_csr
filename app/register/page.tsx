"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/providers/ToastProvider";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n";

const t = getTranslations("ko");

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || t.messages.registerError, "error");
        return;
      }

      showToast(t.messages.registerSuccess, "success");
      router.push("/login");
    } catch (error) {
      showToast(t.messages.registerError, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            {t.auth.register}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            새 계정을 만들어주세요
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            <Input
              {...register("name")}
              type="text"
              label={t.auth.name}
              error={errors.name?.message}
              autoComplete="name"
              aria-required="true"
            />
            <Input
              {...register("email")}
              type="email"
              label={t.auth.email}
              error={errors.email?.message}
              autoComplete="email"
              aria-required="true"
            />
            <Input
              {...register("school")}
              type="text"
              label={t.auth.school}
              error={errors.school?.message}
              autoComplete="organization"
              aria-required="true"
            />
            <Select
              {...register("role", { required: true })}
              label={t.auth.role}
              error={errors.role?.message}
              options={[
                { value: "", label: t.auth.selectRole },
                { value: "student", label: t.auth.roleStudent },
                { value: "teacher", label: t.auth.roleTeacher },
              ]}
              aria-required="true"
            />
            <Input
              {...register("password")}
              type="password"
              label={t.auth.password}
              error={errors.password?.message}
              autoComplete="new-password"
              aria-required="true"
            />
            <Input
              {...register("confirmPassword")}
              type="password"
              label={t.auth.confirmPassword}
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              aria-required="true"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t.auth.register}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t.auth.alreadyHaveAccount}{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {t.auth.login}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

