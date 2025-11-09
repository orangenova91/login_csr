import { z } from "zod";

// 로그인 스키마
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요")
    .email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

// 회원가입 스키마
export const registerSchema = z
  .object({
    name: z.string().min(1, "이름을 입력해주세요").max(50, "이름은 50자 이하여야 합니다"),
    email: z
      .string()
      .min(1, "이메일을 입력해주세요")
      .email("유효한 이메일 주소를 입력해주세요"),
    password: z
      .string()
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다"
      ),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
    school: z.string().min(1, "학교명을 입력해주세요").max(100, "학교명은 100자 이하여야 합니다"),
    role: z.enum(["student", "teacher"], {
      errorMap: () => ({ message: "역할을 선택해주세요" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

// 비밀번호 재설정 요청 스키마
export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요")
    .email("유효한 이메일 주소를 입력해주세요"),
});

// 비밀번호 재설정 스키마
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "토큰이 필요합니다"),
    password: z
      .string()
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다"
      ),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

// 이메일 인증 스키마
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "토큰이 필요합니다"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

