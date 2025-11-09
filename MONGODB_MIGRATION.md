# MongoDB 마이그레이션 가이드

## 변경 사항 요약

### 1. Prisma 스키마 변경 (`prisma/schema.prisma`)
- 데이터베이스 provider: `postgresql` → `mongodb`
- ID 필드: `@default(cuid())` → `@default(auto()) @map("_id") @db.ObjectId`
- PostgreSQL 전용 타입 제거: `@db.Text` → 일반 `String`
- 컬렉션 매핑 추가: `@@map("users")`, `@@map("accounts")` 등

### 2. 환경 변수 변경
- PostgreSQL 연결 문자열 → MongoDB 연결 문자열
- 로컬: `mongodb://localhost:27017/schoolhub`
- Atlas: `mongodb+srv://username:password@cluster.mongodb.net/schoolhub`

### 3. 문서 업데이트
- README.md
- SETUP_GUIDE.md
- env.example

## 주요 차이점

### MongoDB의 특징
1. **ObjectId**: MongoDB는 기본적으로 ObjectId를 ID로 사용
2. **스키마 없는 구조**: Prisma가 스키마를 강제하지만 MongoDB는 유연함
3. **컬렉션**: 테이블 대신 컬렉션 사용
4. **관계**: MongoDB도 관계를 지원하지만 NoSQL 특성상 유연함

### Prisma와 MongoDB
- Prisma는 MongoDB를 완전히 지원
- ObjectId를 String으로 처리
- 관계(Relations) 지원
- 인덱스 및 고유 제약 조건 지원

## 다음 단계

### 1. Prisma 클라이언트 재생성
```bash
npm run db:generate
```

### 2. 환경 변수 설정
`.env.local` 파일에 MongoDB 연결 문자열 추가:
```env
DATABASE_URL="mongodb://localhost:27017/schoolhub"
# 또는 MongoDB Atlas
# DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/schoolhub?retryWrites=true&w=majority"
```

### 3. 데이터베이스 스키마 적용
```bash
npm run db:push
```

### 4. 개발 서버 재시작
```bash
npm run dev
```

## MongoDB 설정 옵션

### 옵션 1: 로컬 MongoDB
1. MongoDB Community Edition 설치
2. MongoDB 서비스 시작
3. 연결 문자열: `mongodb://localhost:27017/schoolhub`

### 옵션 2: MongoDB Atlas (권장)
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 계정 생성
2. 무료 클러스터 생성 (M0)
3. Database Access에서 사용자 생성
4. Network Access에서 IP 주소 추가
5. Connect > Connect your application에서 연결 문자열 복사

## 주의사항

1. **기존 데이터**: PostgreSQL에서 MongoDB로 마이그레이션하는 경우 데이터 이전 필요
2. **인덱스**: Prisma가 자동으로 인덱스를 생성하지만, 필요시 수동으로 최적화 가능
3. **트랜잭션**: MongoDB는 트랜잭션을 지원하지만, 단일 문서 작업에서는 필요 없음
4. **성능**: MongoDB는 읽기 성능이 우수하며, 수평 확장이 용이함

## 문제 해결

### 연결 오류
- MongoDB 서비스가 실행 중인지 확인
- 연결 문자열이 올바른지 확인
- 방화벽 설정 확인 (Atlas 사용 시)

### 스키마 오류
- `npm run db:generate` 재실행
- `npm run db:push` 재실행
- Prisma Studio로 데이터 확인: `npm run db:studio`

## 코드 변경 없음

좋은 소식: **애플리케이션 코드는 변경할 필요가 없습니다!**
- Prisma가 데이터베이스 차이를 추상화
- 같은 API를 사용하여 데이터베이스 작업
- NextAuth와의 통합도 그대로 작동

## 성능 최적화 팁

1. **인덱스**: 이메일, 토큰 등 자주 쿼리하는 필드에 인덱스 생성 (Prisma가 자동 처리)
2. **연결 풀링**: Prisma가 자동으로 연결 풀 관리
3. **Atlas 사용**: 프로덕션에서는 MongoDB Atlas 사용 권장 (자동 백업, 모니터링)

