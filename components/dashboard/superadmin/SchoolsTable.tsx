"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type SchoolData = {
  id: string;
  name: string;
  schoolType: string;
  adminUserId: string;
  createdBy: string | null;
  contactName: string;
  contactPhone: string;
  gradeInfo: string;
  totalClasses: number | null;
  totalStudents: number | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  admin: {
    id: string;
    email: string;
    name: string | null;
  };
  creator: {
    id: string;
    email: string;
    name: string | null;
  } | null;
};

type SchoolsTableProps = {
  schools: SchoolData[];
};

type SortKey = "name" | "contactName" | "totalClasses" | "totalStudents" | "status" | "createdAt";

export function SchoolsTable({ schools }: SchoolsTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const columnConfig: Array<{
    key: SortKey;
    label: string;
    align?: "left" | "center" | "right";
  }> = [
    { key: "name", label: "학교 이름" },
    { key: "contactName", label: "담당자" },
    { key: "totalClasses", label: "학급수", align: "right" },
    { key: "totalStudents", label: "학생수", align: "right" },
    { key: "status", label: "상태", align: "center" },
    { key: "createdAt", label: "생성일" },
  ];

  const sortedSchools = useMemo(() => {
    const sorted = [...schools];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "contactName":
          aValue = a.contactName;
          bValue = b.contactName;
          break;
        case "totalClasses":
          aValue = a.totalClasses ?? 0;
          bValue = b.totalClasses ?? 0;
          break;
        case "totalStudents":
          aValue = a.totalStudents ?? 0;
          bValue = b.totalStudents ?? 0;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [schools, sortConfig]);

  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSchools.slice(start, start + pageSize);
  }, [sortedSchools, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedSchools.length / pageSize);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: "활성", className: "bg-green-100 text-green-700" },
      inactive: { label: "비활성", className: "bg-gray-100 text-gray-700" },
      suspended: { label: "정지", className: "bg-red-100 text-red-700" },
    };

    const statusInfo = statusMap[status] || statusMap.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">학교 목록</h3>
        <p className="text-sm text-gray-500 mt-1">총 {schools.length}개의 학교</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columnConfig.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                    column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : ""
                  }`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className={`flex items-center gap-2 ${column.align === "right" ? "justify-end" : ""}`}>
                    {column.label}
                    {sortConfig.key === column.key && (
                      <span>
                        {sortConfig.direction === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedSchools.length === 0 ? (
              <tr>
                <td colSpan={columnConfig.length} className="px-6 py-12 text-center text-gray-500">
                  등록된 학교가 없습니다.
                </td>
              </tr>
            ) : (
              paginatedSchools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{school.name}</div>
                    <div className="text-xs text-gray-500 mt-1">Admin: {school.admin.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{school.contactName}</div>
                    <div className="text-xs text-gray-500 mt-1">{school.contactPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{school.totalClasses?.toLocaleString() || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{school.totalStudents?.toLocaleString() || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(school.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(school.createdAt)}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">페이지당 항목:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              이전
            </button>
            <span className="text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

