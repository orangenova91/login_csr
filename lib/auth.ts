import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { verifyPassword } from "./utils";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.hashedPassword) {
          // 보안: 계정 존재 여부를 구분하지 않음
          throw new Error("이메일 또는 비밀번호가 올바르지 않습니다");
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          // 보안: 계정 존재 여부를 구분하지 않음
          throw new Error("이메일 또는 비밀번호가 올바르지 않습니다");
        }

        // 이메일 인증이 활성화된 경우 확인
        if (process.env.ENABLE_EMAIL_VERIFICATION === "true" && !user.emailVerified) {
          throw new Error("이메일 인증이 필요합니다");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          school: user.school,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.school = user.school;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.school = token.school as string | null;
        session.user.role = token.role as string | null;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30일
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

