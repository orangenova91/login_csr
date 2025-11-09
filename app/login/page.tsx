"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/providers/ToastProvider";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n";

const t = getTranslations("ko");

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        showToast(t.messages.loginError, "error");
      } else {
        showToast(t.messages.loginSuccess, "success");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      showToast(t.messages.loginError, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            {t.auth.login}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            SchoolHub에 오신 것을 환영합니다
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            <Input
              {...register("email")}
              type="email"
              label={t.auth.email}
              error={errors.email?.message}
              autoComplete="email"
              aria-required="true"
            />
            <Input
              {...register("password")}
              type="password"
              label={t.auth.password}
              error={errors.password?.message}
              autoComplete="current-password"
              aria-required="true"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/reset-password"
              className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {t.auth.forgotPassword}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t.auth.login}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t.auth.dontHaveAccount}{" "}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {t.auth.createAccount}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

