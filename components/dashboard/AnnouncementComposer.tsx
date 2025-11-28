"use client";

import { FormEvent, useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon, Undo, Redo, Heading2, Send } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const audienceOptions = [
  { value: "all", label: "전교생" },
  { value: "grade-1", label: "1학년" },
  { value: "grade-2", label: "2학년" },
  { value: "grade-3", label: "3학년" },
  { value: "parents", label: "학부모" },
  { value: "teachers", label: "교직원" },
];

const getDefaultPublishAt = () =>
  new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

interface AnnouncementComposerPayload {
  title: string;
  audience: string;
  author: string;
  content: string;
  isScheduled: boolean;
  publishAt?: string;
}

interface AnnouncementComposerProps {
  authorName: string;
  onPreview?: (payload: AnnouncementComposerPayload) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
  editId?: string; // 수정 모드일 때 공지사항 ID
  onEditComplete?: () => void; // 수정 완료 후 콜백
}

export function AnnouncementComposer({ authorName, onPreview, isOpen: controlledIsOpen, onOpenChange, showButton = true, editId, onEditComplete }: AnnouncementComposerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // 외부에서 제어하는 경우와 내부에서 제어하는 경우 모두 지원
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  if (!isOpen) {
    if (!showButton) {
      return null;
    }
    return (
      <Button onClick={() => setIsOpen(true)}>
        글쓰기
      </Button>
    );
  }

  return <AnnouncementComposerForm authorName={authorName} onPreview={onPreview} onClose={() => setIsOpen(false)} editId={editId} onEditComplete={onEditComplete} />;
}

function AnnouncementComposerForm({
  authorName,
  onPreview,
  onClose,
  editId,
  onEditComplete,
}: AnnouncementComposerProps & { onClose: () => void; editId?: string; onEditComplete?: () => void }) {
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [useSchedule, setUseSchedule] = useState(false);
  const [publishAt, setPublishAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!editId);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder: "공지 내용을 입력하세요...",
      }),
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] rounded-lg border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500",
      },
    },
    content: "",
    immediatelyRender: false,
  });

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (editId && editor) {
      const loadAnnouncement = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/announcements/${editId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "공지사항을 불러오는데 실패했습니다.");
          }

          const announcement = data.announcement;
          setTitle(announcement.title);
          setAudience(announcement.audience);
          setUseSchedule(announcement.isScheduled);
          setPublishAt(announcement.publishAt ? new Date(announcement.publishAt).toISOString().slice(0, 16) : "");
          editor.commands.setContent(announcement.content);
        } catch (err: any) {
          console.error("Failed to load announcement:", err);
          setError(err.message || "공지사항을 불러오는 중 오류가 발생했습니다.");
        } finally {
          setIsLoading(false);
        }
      };

      loadAnnouncement();
    }
  }, [editId, editor]);

  // 제목이 비어있거나 알림 대상이 없거나 제출 중일 때 비활성화
  const hasTitle = title.trim().length > 0;
  const hasAudience = Boolean(audience) && String(audience).trim().length > 0;
  const isDisabled = !hasTitle || !hasAudience || isSubmitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;

    const content = editor.getHTML();
    const plainText = editor.getText().trim();

    if (!plainText) {
      setError("공지 본문을 입력해주세요.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const payload: AnnouncementComposerPayload = {
      title: title.trim(),
      audience,
      author: authorName.trim(),
      content,
      isScheduled: useSchedule,
      publishAt: useSchedule ? publishAt : undefined,
    };

    try {
      // publishAt을 ISO 형식으로 변환 (datetime-local 형식에서)
      const requestBody = {
        ...payload,
        publishAt: payload.publishAt
          ? new Date(payload.publishAt).toISOString()
          : undefined,
      };

      const url = editId ? `/api/announcements/${editId}` : "/api/announcements";
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (editId ? "공지사항 수정에 실패했습니다." : "공지사항 생성에 실패했습니다."));
      }

      // 성공 시 콜백 호출
      onPreview?.(payload);
      onEditComplete?.();

      // 폼 초기화
      editor.commands.clearContent(true);
      setTitle("");
      setUseSchedule(false);
      setPublishAt("");
      setIsSubmitting(false);

      // 폼 닫기
      onClose();
    } catch (err: any) {
      console.error(editId ? "Update announcement error:" : "Create announcement error:", err);
      setError(err.message || (editId ? "공지사항 수정 중 오류가 발생했습니다." : "공지사항 생성 중 오류가 발생했습니다."));
      setIsSubmitting(false);
    }
  };

  const toolbarItems =
    editor &&
    [
      {
        label: "굵게",
        icon: <Bold className="h-4 w-4" />,
        action: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive("bold"),
      },
      {
        label: "기울임",
        icon: <Italic className="h-4 w-4" />,
        action: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive("italic"),
      },
      {
        label: "소제목",
        icon: <Heading2 className="h-4 w-4" />,
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        active: editor.isActive("heading", { level: 2 }),
      },
      {
        label: "불릿 리스트",
        icon: <List className="h-4 w-4" />,
        action: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive("bulletList"),
      },
      {
        label: "번호 리스트",
        icon: <ListOrdered className="h-4 w-4" />,
        action: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive("orderedList"),
      },
      {
        label: "인용구",
        icon: <Quote className="h-4 w-4" />,
        action: () => editor.chain().focus().toggleBlockquote().run(),
        active: editor.isActive("blockquote"),
      },
      {
        label: "링크",
        icon: <LinkIcon className="h-4 w-4" />,
        action: () => {
          const previousUrl = editor.getAttributes("link").href;
          const url = window.prompt("링크 주소를 입력하세요.", previousUrl);
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        },
        active: editor.isActive("link"),
      },
      {
        label: "되돌리기",
        icon: <Undo className="h-4 w-4" />,
        action: () => editor.chain().focus().undo().run(),
      },
      {
        label: "다시하기",
        icon: <Redo className="h-4 w-4" />,
        action: () => editor.chain().focus().redo().run(),
      },
    ];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500">공지사항을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            {editId ? "공지 수정" : "새 공지 작성"}
          </p>
          <h2 className="text-xl font-bold text-gray-900">{editId ? "공지 수정" : "공지 입력"}</h2>
          <p className="text-sm text-gray-500">제목과 대상을 지정한 뒤 본문을 자유롭게 작성할 수 있어요.</p>
        </div>
        <Button type="button" variant="ghost" onClick={onClose}>
          닫기
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          label="제목"
          placeholder="예: 11월 학부모 상담 안내"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
          <Input label="작성자" value={authorName} readOnly />
          <Select
            label="알림 대상"
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            options={audienceOptions}
            placeholder="알림 대상을 선택하세요"
          />
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">예약 발행</p>
                <p className="text-xs text-gray-500">필요 시 자동 게시 시간 지정</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={useSchedule}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setUseSchedule(checked);
                    // 예약 발행을 체크하면 기본값 설정, 해제하면 빈 문자열
                    if (checked && !publishAt) {
                      setPublishAt(getDefaultPublishAt());
                    } else if (!checked) {
                      setPublishAt("");
                    }
                  }}
                />
                사용
              </label>
            </div>
            {useSchedule && (
              <Input
                type="datetime-local"
                label="시작 시각"
                value={publishAt}
                onChange={(event) => setPublishAt(event.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="mt-3"
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
          {toolbarItems?.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              aria-label={item.label}
              className={cn(
                "rounded-md p-2 text-sm text-gray-600 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                item.active && "bg-white text-blue-600 shadow-sm"
              )}
            >
              {item.icon}
            </button>
          ))}
        </div>

        <EditorContent editor={editor} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" disabled={isDisabled} isLoading={isSubmitting}>
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting 
            ? (editId ? "수정 중..." : "저장 중...") 
            : (editId ? "수정하기" : "저장하기")}
        </Button>
      </div>
    </form>
  );
}

