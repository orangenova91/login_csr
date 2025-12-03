import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 eventType이 null인 CalendarEvent 레코드를 찾는 중...");
  
  // null인 레코드 찾기
  const nullEvents = await prisma.calendarEvent.findMany({
    where: {
      eventType: null,
    },
    select: {
      id: true,
      title: true,
      startDate: true,
    },
  });

  console.log(`📊 발견된 null 레코드: ${nullEvents.length}개`);

  if (nullEvents.length === 0) {
    console.log("✅ 정리할 레코드가 없습니다.");
    return;
  }

  // null 값을 "기타"로 업데이트
  console.log("🔄 null 값을 '기타'로 업데이트하는 중...");
  const result = await prisma.calendarEvent.updateMany({
    where: {
      eventType: null,
    },
    data: {
      eventType: "기타",
    },
  });

  console.log(`✅ ${result.count}개의 레코드가 업데이트되었습니다.`);
  
  // 업데이트된 레코드 확인
  if (nullEvents.length > 0) {
    console.log("\n📋 업데이트된 레코드 목록:");
    nullEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} (${event.startDate.toISOString().split('T')[0]})`);
    });
  }
}

main()
  .catch((e) => {
    console.error("❌ 오류 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

