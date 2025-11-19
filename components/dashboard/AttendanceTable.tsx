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

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | '';

type StoredAttendance = {
  statuses: Record<string, AttendanceStatus>;
  notes: Record<string, string>;
  updatedAt: string;
};

export default function AttendanceTable({ courseId, students }: Props) {
  const selectedKey = `course:${courseId}:students`;
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savedTick, setSavedTick] = useState(0);

  const storageKey = useMemo(
    () => `course:${courseId}:attendance:${date}`,
    [courseId, date]
  );

  const selectedStudents = useMemo(() => {
    if (!selectedIds.length) return [];
    const idSet = new Set(selectedIds);
    return students.filter((s) => idSet.has(s.id));
  }, [selectedIds, students]);

  // load selected students
  useEffect(() => {
    try {
      const raw = localStorage.getItem(selectedKey);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      setSelectedIds(ids);
    } catch {
      setSelectedIds([]);
    }
  }, [selectedKey]);

  // react to selection updates from modal
  useEffect(() => {
    const onUpdated = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as { courseId?: string } | undefined;
        if (detail?.courseId && detail.courseId !== courseId) return;
        const raw = localStorage.getItem(selectedKey);
        const ids = raw ? (JSON.parse(raw) as string[]) : [];
        setSelectedIds(ids);
      } catch {}
    };
    window.addEventListener('course:students:updated', onUpdated as EventListener);
    return () => window.removeEventListener('course:students:updated', onUpdated as EventListener);
  }, [courseId, selectedKey]);

  // load attendance for date
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setStatuses({});
        setNotes({});
        return;
      }
      const parsed = JSON.parse(raw) as StoredAttendance;
      setStatuses(parsed.statuses || {});
      setNotes(parsed.notes || {});
    } catch {
      setStatuses({});
      setNotes({});
    }
  }, [storageKey, savedTick]);

  const save = () => {
    try {
      const payload: StoredAttendance = {
        statuses,
        notes,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setSavedTick((t) => t + 1);
    } catch {}
  };

  const setAll = (value: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const s of selectedStudents) {
      next[s.id] = value;
    }
    setStatuses(next);
  };

  const onChangeStatus = (id: string, value: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: value }));
  };

  const onChangeNote = (id: string, value: string) => {
    setNotes((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">기록 날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAll('present')}
            className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            모두 출석
          </button>
          <button
            type="button"
            onClick={() => setAll('absent')}
            className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            모두 결석
          </button>
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>

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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                출결
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                비고
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {selectedStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm text-gray-500 text-center">
                  선택된 학생이 없습니다. 학생 관리에서 학생을 선택해 저장하세요.
                </td>
              </tr>
            ) : (
              selectedStudents.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{s.name ?? '이름 없음'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{s.email}</td>
                  <td className="px-4 py-2">
                    <select
                      value={statuses[s.id] ?? ''}
                      onChange={(e) => onChangeStatus(s.id, e.target.value as AttendanceStatus)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택</option>
                      <option value="present">출석</option>
                      <option value="late">지각</option>
                      <option value="excused">공결</option>
                      <option value="absent">결석</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={notes[s.id] ?? ''}
                      onChange={(e) => onChangeNote(s.id, e.target.value)}
                      placeholder="메모"
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


