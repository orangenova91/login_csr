import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET() {
  let client: MongoClient | null = null;
  
  try {
    const mongoUri = process.env.DATABASE_URL;
    if (!mongoUri) {
      return NextResponse.json(
        { error: "DATABASE_URL이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // MongoDB 클라이언트 생성
    client = new MongoClient(mongoUri);
    await client.connect();

    const db = client.db();
    const collection = db.collection("2022curriculum");

    // 과목명 추출 및 중복 제거
    const subjects = await collection.distinct("과목명");

    // 빈 값 제거 및 정렬
    const subjectNames = subjects
      .filter((name: any) => name && String(name).trim().length > 0)
      .map((name: any) => String(name).trim())
      .sort();

    return NextResponse.json({ subjects: subjectNames }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch subjects:", error);
    return NextResponse.json(
      { error: "과목명을 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}

