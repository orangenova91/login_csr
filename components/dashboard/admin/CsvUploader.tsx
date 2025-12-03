"use client";

import { useState } from "react";
import { Upload, X, CheckCircle, AlertCircle, Download } from "lucide-react";

type UploadResult = {
  success: boolean;
  message: string;
  created?: number;
  skipped?: number;
  updated?: number;
  notFound?: number;
  errors?: string[];
};

type Mode = "import" | "update";

export function CsvUploader() {
  const [mode, setMode] = useState<Mode>("import");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
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

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setFile(null);
    setResult(null);
    setShowResult(false);
    const fileInput = document.getElementById(`csv-file-input-${newMode}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
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

      const endpoint = mode === "import" ? "/api/admin/users/import" : "/api/admin/users/bulk-update";
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (mode === "import") {
          setResult({
            success: true,
            message: data.message || "사용자 등록이 완료되었습니다.",
            created: data.created,
            skipped: data.skipped,
            errors: data.errors,
          });
        } else {
          setResult({
            success: true,
            message: data.message || "사용자 정보 수정이 완료되었습니다.",
            updated: data.updated,
            notFound: data.notFound,
            errors: data.errors,
          });
        }
      } else {
        setResult({
          success: false,
          message: data.error || "업로드 중 오류가 발생했습니다.",
          errors: data.errors,
        });
      }
      setShowResult(true);

      // 성공 시 페이지 새로고침
      if (response.ok) {
        const shouldReload = mode === "import" 
          ? (data.created && data.created > 0)
          : (data.updated && data.updated > 0);
        if (shouldReload) {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
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
    const fileInput = document.getElementById(`csv-file-input-${mode}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    if (mode === "update") {
      // 수정 모드: 현재 사용자 데이터 다운로드
      setIsDownloadingTemplate(true);
      try {
        const response = await fetch("/api/admin/users/export-template");
        
        // 응답 타입 확인
        const contentType = response.headers.get("content-type");
        
        if (!response.ok) {
          // 에러 응답인 경우 JSON으로 파싱
          let errorMessage = "템플릿 다운로드에 실패했습니다.";
          if (contentType?.includes("application/json")) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
              if (errorData.details) {
                console.error("Template download error details:", errorData.details);
              }
            } catch (e) {
              // JSON 파싱 실패 시 기본 메시지 사용
              console.error("Failed to parse error response:", e);
            }
          }
          throw new Error(errorMessage);
        }
        
        // 성공 응답인 경우 blob으로 처리
        const blob = await response.blob();
        
        // 빈 blob 체크
        if (blob.size === 0) {
          throw new Error("다운로드할 데이터가 없습니다. 사용자가 없거나 권한이 없을 수 있습니다.");
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "users_update_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : "템플릿 다운로드 중 오류가 발생했습니다.";
        alert(errorMessage);
        console.error("CSV template download error:", error);
      } finally {
        setIsDownloadingTemplate(false);
      }
    } else {
      // 등록 모드: 빈 템플릿 생성
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
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      {/* 탭 메뉴 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">CSV 파일로 사용자 관리</h3>
          <p className="text-xs text-gray-500 mt-1">
            CSV 파일을 업로드하여 여러 사용자를 한 번에 등록하거나 수정할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={isDownloadingTemplate}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Download className="w-4 h-4" />
          {isDownloadingTemplate 
            ? "다운로드 중..." 
            : mode === "update" 
            ? "수정 템플릿 다운로드" 
            : "등록 템플릿 다운로드"}
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => handleModeChange("import")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === "import"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          사용자 등록
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("update")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === "update"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          사용자 수정
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label
            htmlFor={`csv-file-input-${mode}`}
            className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            <input
              id={`csv-file-input-${mode}`}
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
                <span className="text-xs text-gray-400">
                  {mode === "import"
                    ? "필수 컬럼: email, name, role, school"
                    : "필수 컬럼: email (수정할 필드만 포함하면 됩니다)"}
                </span>
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
              {isUploading
                ? "업로드 중..."
                : mode === "import"
                ? "업로드 및 등록"
                : "업로드 및 수정"}
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
                    {mode === "import" ? (
                      <>
                        {result.created !== undefined && (
                          <p>✓ {result.created}명의 사용자가 등록되었습니다.</p>
                        )}
                        {result.skipped !== undefined && result.skipped > 0 && (
                          <p>⚠ {result.skipped}명의 사용자는 이미 존재하여 건너뛰었습니다.</p>
                        )}
                      </>
                    ) : (
                      <>
                        {result.updated !== undefined && (
                          <p>✓ {result.updated}명의 사용자 정보가 수정되었습니다.</p>
                        )}
                        {result.notFound !== undefined && result.notFound > 0 && (
                          <p>⚠ {result.notFound}명의 사용자를 찾을 수 없습니다.</p>
                        )}
                      </>
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

