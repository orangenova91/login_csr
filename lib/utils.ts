import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 비밀번호 해시 함수 (bcrypt)
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

// 비밀번호 검증 함수
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hashedPassword);
}

// 랜덤 토큰 생성
export function generateToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

