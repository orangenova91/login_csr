"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordRequestSchema,
  resetPasswordSchema,
  type ResetPasswordRequestInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/providers/ToastProvider";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n";

const t = getTranslations("ko");

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestMode, setIsRequestMode] = useState(!token);

  const requestForm = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetPasswordRequestSchema),
  });

  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
    },
  });

  useEffect(() => {
    if (token) {
      resetForm.setValue("token", token);
      setIsRequestMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onRequestSubmit = async (data: ResetPasswordRequestInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || t.messages.resetPasswordError, "error");
        return;
      }

      showToast(t.messages.resetPasswordSent, "success");
    } catch (error) {
      showToast(t.messages.resetPasswordError, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || t.messages.resetPasswordError, "error");
        return;
      }

      showToast(t.messages.resetPasswordSuccess, "success");
      router.push("/login");
    } catch (error) {
      showToast(t.messages.resetPasswordError, "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isRequestMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-center text-gray-900">
              {t.auth.resetPassword}
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              이메일 주소를 입력하시면 재설정 링크를 보내드립니다
            </p>
          </div>
          <form
            className="mt-8 space-y-6"
            onSubmit={requestForm.handleSubmit(onRequestSubmit)}
            noValidate
          >
            <Input
              {...requestForm.register("email")}
              type="email"
              label={t.auth.email}
              error={requestForm.formState.errors.email?.message}
              autoComplete="email"
              aria-required="true"
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {t.auth.sendResetLink}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {t.auth.backToLogin}
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            {t.auth.resetPassword}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            새 비밀번호를 입력해주세요
          </p>
        </div>
        <form
          className="mt-8 space-y-6"
          onSubmit={resetForm.handleSubmit(onResetSubmit)}
          noValidate
        >
          <input type="hidden" {...resetForm.register("token")} />
          <div className="space-y-4">
            <Input
              {...resetForm.register("password")}
              type="password"
              label={t.auth.password}
              error={resetForm.formState.errors.password?.message}
              autoComplete="new-password"
              aria-required="true"
            />
            <Input
              {...resetForm.register("confirmPassword")}
              type="password"
              label={t.auth.confirmPassword}
              error={resetForm.formState.errors.confirmPassword?.message}
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
            {t.auth.resetPassword}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {t.auth.backToLogin}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

