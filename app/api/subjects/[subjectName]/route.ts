import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { subjectName: string } }
) {
  let client: MongoClient | null = null;
  
  try {
    const mongoUri = process.env.DATABASE_URL;
    if (!mongoUri) {
      return NextResponse.json(
        { error: "DATABASE_URL이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const subjectName = decodeURIComponent(params.subjectName);

    if (!subjectName || subjectName === "") {
      return NextResponse.json(
        { error: "과목명이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // MongoDB 클라이언트 생성
    client = new MongoClient(mongoUri);
    await client.connect();

    const db = client.db();
    const collection = db.collection("2022curriculum");

    // 해당 과목명으로 검색하여 첫 번째 문서 가져오기
    const subjectData = await collection.findOne({
      과목명: subjectName,
    });

    if (!subjectData) {
      return NextResponse.json(
        { error: "해당 과목명의 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 교과구분, 교과(군), 과목구분 추출
    const result = {
      careerTrack: subjectData.교과구분 || subjectData.careerTrack || "",
      subjectGroup: subjectData["교과(군)"] || subjectData.교과군 || subjectData.subjectGroup || "",
      subjectArea: subjectData.과목구분 || subjectData.subjectArea || "",
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch subject details:", error);
    return NextResponse.json(
      { error: "과목 정보를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}

