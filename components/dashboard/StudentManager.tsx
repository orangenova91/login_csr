'use client';

import { useState } from "react";

type Student = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  courseId: string;
  students: Student[];
};

export default function StudentManager({ courseId, students }: Props) {
  const [open, setOpen] = useState(false);
  const storageKey = `course:${courseId}:students`;
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return {};
      const ids: string[] = JSON.parse(raw);
      const map: Record<string, boolean> = {};
      for (const id of ids) map[id] = true;
      return map;
    } catch {
      return {};
    }
  });

  const toggle = (id: string) => {
    setSelectedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const onSave = () => {
    try {
      const ids = Object.keys(selectedMap).filter((id) => selectedMap[id]);
      localStorage.setItem(storageKey, JSON.stringify(ids));
      // notify listeners in the same tab
      try {
        window.dispatchEvent(
          new CustomEvent("course:students:updated", { detail: { courseId } })
        );
      } catch {}
      setOpen(false);
    } catch {
      // no-op
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">학생 관리 버튼을 클릭해 학생 목록을 확인하세요.</p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          학생 관리
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">학생 관리</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="rounded-xl border border-gray-200 max-h-[70vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                        선택
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이메일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-sm text-gray-500 text-center">
                          학생 계정이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      students.map((s) => (
                        <tr key={s.id}>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={!!selectedMap[s.id]}
                              onChange={() => toggle(s.id)}
                              aria-label={`${s.name ?? "이름 없음"} 선택`}
                            />
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{s.name ?? "이름 없음"}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{s.email}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={onSave}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


