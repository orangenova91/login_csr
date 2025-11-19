"use client";

import { FormEvent, useState } from "react";
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
}

export function AnnouncementComposer({ authorName, onPreview }: AnnouncementComposerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        글쓰기
      </Button>
    );
  }

  return <AnnouncementComposerForm authorName={authorName} onPreview={onPreview} onClose={() => setIsOpen(false)} />;
}

function AnnouncementComposerForm({
  authorName,
  onPreview,
  onClose,
}: AnnouncementComposerProps & { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState(audienceOptions[0].value);
  const [useSchedule, setUseSchedule] = useState(false);
  const [publishAt, setPublishAt] = useState(() => getDefaultPublishAt());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const isDisabled =
    !editor ||
    !title.trim() ||
    !authorName.trim() ||
    editor.getText().trim().length === 0 ||
    (useSchedule && !publishAt) ||
    isSubmitting;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
    console.log("Announcement draft:", payload);
    onPreview?.(payload);

    setTimeout(() => {
      editor.commands.clearContent(true);
      setTitle("");
      setUseSchedule(false);
      setPublishAt(getDefaultPublishAt());
      setIsSubmitting(false);
    }, 500);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">새 공지 작성</p>
          <h2 className="text-xl font-bold text-gray-900">공지 입력</h2>
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
                  onChange={(event) => setUseSchedule(event.target.checked)}
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

      <Button type="submit" disabled={isDisabled} isLoading={isSubmitting} className="w-full sm:w-auto">
        <Send className="mr-2 h-4 w-4" />
        임시 저장
      </Button>
    </form>
  );
}

