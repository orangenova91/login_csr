"use client";

import { useState } from "react";
import { Upload, X, CheckCircle, AlertCircle, Download } from "lucide-react";

type UploadResult = {
  success: boolean;
  message: string;
  created?: number;
  skipped?: number;
  errors?: string[];
};

export function CsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setResult(null);
        setShowResult(false);
      } else {
        alert("CSV 파일만 업로드 가능합니다.");
        e.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("파일을 선택해주세요.");
      return;
    }

    setIsUploading(true);
    setResult(null);
    setShowResult(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/users/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "사용자 등록이 완료되었습니다.",
          created: data.created,
          skipped: data.skipped,
          errors: data.errors,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "업로드 중 오류가 발생했습니다.",
          errors: data.errors,
        });
      }
      setShowResult(true);

      // 성공 시 페이지 새로고침
      if (response.ok && data.created && data.created > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: "업로드 중 오류가 발생했습니다.",
        errors: [error instanceof Error ? error.message : "알 수 없는 오류"],
      });
      setShowResult(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setShowResult(false);
    const fileInput = document.getElementById("csv-file-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    // CSV 템플릿 생성
    const headers = ["email", "name", "role", "school", "password"];
    const exampleRows = [
      ["student1@example.com", "홍길동", "student", "서울고등학교", "MyPassword123!"],
      ["teacher1@example.com", "김선생", "teacher", "서울고등학교", ""],
      ["admin@example.com", "관리자", "admin", "서울고등학교", ""],
    ];

    // CSV 형식으로 변환
    const escapeCsvValue = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.join(","),
      ...exampleRows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    // BOM 추가 (한글 깨짐 방지)
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">CSV 파일로 사용자 등록</h3>
          <p className="text-xs text-gray-500 mt-1">
            CSV 파일을 업로드하여 여러 사용자를 한 번에 등록할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Download className="w-4 h-4" />
          템플릿 다운로드
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label
            htmlFor="csv-file-input"
            className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">CSV 파일을 선택하거나 드래그하세요</span>
                <span className="text-xs text-gray-400">필수 컬럼: email, name, role, school</span>
              </div>
            )}
          </label>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isUploading ? "업로드 중..." : "업로드 및 등록"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              취소
            </button>
          </div>
        )}

        {showResult && result && (
          <div
            className={`rounded-lg p-4 ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.message}
                </p>
                {result.success && (
                  <div className="mt-2 text-xs text-green-700">
                    {result.created !== undefined && (
                      <p>✓ {result.created}명의 사용자가 등록되었습니다.</p>
                    )}
                    {result.skipped !== undefined && result.skipped > 0 && (
                      <p>⚠ {result.skipped}명의 사용자는 이미 존재하여 건너뛰었습니다.</p>
                    )}
                  </div>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2 text-xs text-red-700">
                    <p className="font-medium">오류:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {result.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>... 외 {result.errors.length - 5}건의 오류</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowResult(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

