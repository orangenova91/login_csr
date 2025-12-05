"use client";

import { MessageCircle, ExternalLink } from "lucide-react";

export default function ChatPage() {
  const chatUrl = process.env.NEXT_PUBLIC_GOOGLE_CHAT_URL || "https://chat.google.com";

  const handleOpenChat = () => {
    window.open(chatUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 rounded-full p-6">
            <MessageCircle className="w-16 h-16 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Google Chat
        </h1>
        <p className="text-gray-600 mb-8">
          Google Chat을 통해 팀원들과 실시간으로 소통하세요.
        </p>
        <button
          onClick={handleOpenChat}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          <MessageCircle className="w-5 h-5" />
          Google Chat 열기
          <ExternalLink className="w-4 h-4" />
        </button>
        <div className="mt-6 text-sm text-gray-500">
          <p>새 탭에서 Google Chat이 열립니다.</p>
        </div>
      </div>
    </div>
  );
}

