"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import EvaluationQuestionForm from "./EvaluationQuestionForm";

interface StudentEvaluationProps {
  courseId: string;
}

interface EvaluationQuestion {
  id: string;
  unit: string;
  questionNumber: string;
  questions: Array<{
    questionType: "객관식" | "서술형";
    questionText: string;
    points: number;
    options?: Array<{ text: string }>;
    correctAnswer?: number;
    modelAnswer?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function StudentEvaluation({ courseId }: StudentEvaluationProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [evaluationQuestions, setEvaluationQuestions] = useState<EvaluationQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvaluationQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/evaluation-questions`);
      const data = await response.json();
      
      if (response.ok) {
        console.log("평가 문항 조회 성공:", data);
        setEvaluationQuestions(data.evaluationQuestions || []);
      } else {
        console.error("평가 문항 조회 실패:", data);
        setEvaluationQuestions([]);
      }
    } catch (error) {
      console.error("평가 문항 조회 오류:", error);
      setEvaluationQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchEvaluationQuestions();
    }
  }, [courseId]);

  const handleSuccess = () => {
    setIsPanelOpen(false);
    fetchEvaluationQuestions();
  };

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button
          type="button"
          variant="primary"
          onClick={() => setIsPanelOpen(true)}
        >
          평가 문항 만들기
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          평가 문항을 불러오는 중...
        </div>
      ) : evaluationQuestions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          평가 문항을 만들려면 위의 "평가 문항 만들기" 버튼을 클릭하세요.
        </div>
      ) : (
        <div className="space-y-4">
          {evaluationQuestions.map((eq) => (
            <div
              key={eq.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{eq.unit}</h3>
                  <p className="text-sm text-gray-500 mt-1">문제 주문번호: {eq.questionNumber}</p>
                </div>
                <div className="text-xs text-gray-400">
                  생성일: {new Date(eq.createdAt).toLocaleString("ko-KR")}
                </div>
              </div>

              <div className="space-y-4">
                {eq.questions.map((question, index) => (
                  <div
                    key={index}
                    className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          문항 {index + 1}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {question.questionType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {question.points}점
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                      {question.questionText}
                    </p>
                    {question.questionType === "객관식" && question.options && (
                      <div className="mt-2 space-y-1">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`text-sm pl-4 ${
                              question.correctAnswer === optIndex
                                ? "text-blue-700 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {optIndex + 1}. {option.text}
                            {question.correctAnswer === optIndex && (
                              <span className="ml-2 text-xs text-blue-600">(정답)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {question.questionType === "서술형" && question.modelAnswer && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs font-medium text-gray-500 mb-1">모범답안:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {question.modelAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 슬라이드 패널 */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isPanelOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* 배경 오버레이 */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setIsPanelOpen(false)}
        />

        {/* 슬라이드 패널 */}
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">평가 문항 만들기</h3>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md p-1"
                aria-label="패널 닫기"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <EvaluationQuestionForm
                courseId={courseId}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
