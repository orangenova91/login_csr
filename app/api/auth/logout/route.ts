import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    // 세션을 무효화하는 로직이 필요하면 여기에 추가
    // NextAuth는 클라이언트에서 signOut을 호출하면 자동으로 처리됩니다
  }

  return NextResponse.json({ message: "로그아웃되었습니다." });
}

