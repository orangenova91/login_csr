"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import EvaluationQuestionForm from "./EvaluationQuestionForm";

interface StudentEvaluationProps {
  courseId: string;
}

export default function StudentEvaluation({ courseId }: StudentEvaluationProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
        평가 문항을 만들려면 위의 "평가 문항 만들기" 버튼을 클릭하세요.
      </div>

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
                onSuccess={() => setIsPanelOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
