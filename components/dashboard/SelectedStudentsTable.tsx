'use client';

import { useEffect, useMemo, useState } from 'react';

type Student = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  courseId: string;
  students: Student[];
};

export default function SelectedStudentsTable({ courseId, students }: Props) {
  const storageKey = `course:${courseId}:students`;
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: string[] = JSON.parse(raw);
      setIds(parsed);
    } catch {
      // no-op
    }
  }, [storageKey]);

  // listen for updates from StudentManager in the same tab
  useEffect(() => {
    const onUpdated = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as { courseId?: string } | undefined;
        if (detail?.courseId && detail.courseId !== courseId) return;
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? (JSON.parse(raw) as string[]) : [];
        setIds(parsed);
      } catch {
        // no-op
      }
    };
    window.addEventListener("course:students:updated", onUpdated as EventListener);
    return () => {
      window.removeEventListener("course:students:updated", onUpdated as EventListener);
    };
  }, [courseId, storageKey]);

  const selectedStudents = useMemo(() => {
    if (!ids.length) return [];
    const idSet = new Set(ids);
    return students.filter((s) => idSet.has(s.id));
  }, [ids, students]);

  if (selectedStudents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
        저장된 학생이 없습니다. 학생 관리에서 선택 후 저장하세요.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              이름
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              이메일
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {selectedStudents.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-2 text-sm text-gray-900">{s.name ?? '이름 없음'}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{s.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


