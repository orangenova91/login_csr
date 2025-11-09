# SchoolHub 로그인 시스템 - 설정 가이드

## 빠른 시작

### 1. 프로젝트 설정

```bash
# 의존성 설치
npm install

# 환경 변수 파일 생성
cp env.example .env.local

# .env.local 파일을 열어 데이터베이스 연결 정보 수정
```

### 2. 데이터베이스 설정

#### MongoDB 데이터베이스 설정

##### 로컬 MongoDB 사용

MongoDB가 설치되어 있다면:
```bash
# MongoDB 서비스 시작 (Windows)
net start MongoDB

# 또는 Linux/Mac
sudo systemctl start mongod
```

##### MongoDB Atlas 사용 (권장)

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)에서 계정 생성
2. 무료 클러스터 생성
3. Database Access에서 사용자 생성
4. Network Access에서 IP 주소 추가 (0.0.0.0/0으로 모든 IP 허용 가능)
5. Connect > Connect your application에서 연결 문자열 복사

#### 환경 변수 설정

`.env.local` 파일에서 다음을 수정하세요:

```env
# 로컬 MongoDB
DATABASE_URL="mongodb://localhost:27017/schoolhub"

# 또는 MongoDB Atlas
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/schoolhub?retryWrites=true&w=majority"

NEXTAUTH_SECRET="여기에-랜덤-시크릿-키-입력"
```

`NEXTAUTH_SECRET` 생성 방법:
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Prisma 설정

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스에 스키마 적용
npm run db:push
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 주요 기능 사용법

### 로그인
- `/login` - 이메일과 비밀번호로 로그인

### 회원가입
- `/register` - 새 계정 생성
- 이메일 중복 검사 자동 수행
- 비밀번호 정책: 최소 8자, 대문자/소문자/숫자 포함

### 비밀번호 재설정
1. `/reset-password` - 이메일 주소 입력
2. 개발 환경: 콘솔에서 재설정 링크 확인
3. 링크 클릭 후 새 비밀번호 입력

### 이메일 인증 (옵션)
`.env.local`에서 활성화:
```env
ENABLE_EMAIL_VERIFICATION="true"
```

1. 회원가입 시 인증 이메일 전송 (개발 환경: 콘솔에 출력)
2. 이메일 링크 클릭하여 인증
3. 인증 완료 후 로그인 가능

### 대시보드
- `/dashboard` - 로그인 후 접근 가능한 보호된 페이지
- 로그아웃 기능 제공

## 보안 기능

### 1. Rate Limiting
- 회원가입: 15분당 5회 제한
- 비밀번호 재설정: 15분당 3회 제한
- 프로덕션에서는 Redis 사용 권장

### 2. CSRF 방어
- NextAuth.js가 자동으로 처리
- SameSite 쿠키로 추가 보호

### 3. 비밀번호 보안
- bcryptjs로 해시 (salt rounds: 12)
- 평문 비밀번호는 절대 저장하지 않음

### 4. 세션 관리
- JWT 기반 세션
- 30일 만료
- httpOnly 쿠키로 XSS 방어

## 프로덕션 배포

### Vercel 배포

1. **GitHub에 프로젝트 푸시**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Vercel에서 프로젝트 임포트**
   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 저장소 선택
   - 프로젝트 설정

3. **환경 변수 설정**
   - Vercel 대시보드 > Settings > Environment Variables
   - 다음 변수 추가:
     - `DATABASE_URL`
     - `NEXTAUTH_URL` (예: https://yourdomain.com)
     - `NEXTAUTH_SECRET`
     - `ENABLE_EMAIL_VERIFICATION` (선택)

4. **데이터베이스 설정**
   - MongoDB Atlas 사용 (권장) 또는
   - 외부 MongoDB 데이터베이스 연결

5. **배포 후 Prisma 마이그레이션**
```bash
# Vercel 배포 후 터미널에서 실행
npx prisma db push
```

### 환경 변수 체크리스트

- [ ] `DATABASE_URL` - MongoDB 연결 문자열
- [ ] `NEXTAUTH_URL` - 프로덕션 도메인
- [ ] `NEXTAUTH_SECRET` - 강력한 시크릿 키
- [ ] `ENABLE_EMAIL_VERIFICATION` - "true" 또는 "false"

## 트러블슈팅

### 데이터베이스 연결 오류
- MongoDB가 실행 중인지 확인 (로컬 사용 시)
- `DATABASE_URL`이 올바른지 확인
- MongoDB Atlas 사용 시 IP 주소가 허용되었는지 확인
- 연결 문자열에 사용자명과 비밀번호가 올바른지 확인

### 인증 오류
- `NEXTAUTH_SECRET`이 설정되었는지 확인
- `NEXTAUTH_URL`이 올바른지 확인
- 브라우저 쿠키가 차단되지 않았는지 확인

### Prisma 오류
```bash
# Prisma 클라이언트 재생성
npm run db:generate

# 데이터베이스 스키마 재적용
npm run db:push
```

## 추가 기능 구현 가이드

### OAuth 프로바이더 추가 (Google)

`lib/auth.ts`에서 Google Provider 추가:

```typescript
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    // ... 기존 CredentialsProvider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // ...
};
```

환경 변수 추가:
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 실제 이메일 발송 구현

비밀번호 재설정 및 이메일 인증에 실제 이메일 서비스 연동:

1. **SendGrid 사용 예시**
```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
  to: user.email,
  from: "noreply@schoolhub.com",
  subject: "비밀번호 재설정",
  html: `<a href="${resetLink}">비밀번호 재설정</a>`,
});
```

2. **AWS SES 사용 예시**
```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: "us-east-1" });

await sesClient.send(new SendEmailCommand({
  Source: "noreply@schoolhub.com",
  Destination: { ToAddresses: [user.email] },
  Message: {
    Subject: { Data: "비밀번호 재설정" },
    Body: { Html: { Data: `<a href="${resetLink}">비밀번호 재설정</a>` } },
  },
}));
```

## 지원

문제가 발생하면 이슈를 등록하거나 문서를 참조하세요.

