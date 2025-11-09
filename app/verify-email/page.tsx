"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/providers/ToastProvider";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n";

const t = getTranslations("ko");

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const verifyEmail = async (verificationToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || t.messages.emailVerificationError, "error");
        return;
      }

      showToast(t.messages.emailVerificationSuccess, "success");
      setIsVerified(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      showToast(t.messages.emailVerificationError, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {t.auth.emailVerification}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            유효하지 않은 인증 링크입니다
          </p>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            {t.auth.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {t.messages.emailVerificationSuccess}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            로그인 페이지로 이동합니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {t.auth.emailVerification}
        </h1>
        {isLoading ? (
          <p className="mt-2 text-sm text-gray-600">이메일을 인증하는 중...</p>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            이메일 인증이 완료되었습니다
          </p>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

