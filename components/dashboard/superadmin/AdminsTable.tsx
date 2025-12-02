"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import EditAdminForm from "@/components/dashboard/admin/EditAdminForm";
import { useToastContext } from "@/components/providers/ToastProvider";

type Admin = {
  id: string;
  email: string;
  name: string | null;
  school: string | null;
  createdAt: Date;
  adminProfile: {
    phoneNumber: string | null;
    school: {
      id: string;
      name: string;
      schoolType: string;
      contactName: string;
      contactPhone: string;
      totalClasses: number | null;
      totalStudents: number | null;
      status: string;
      createdAt: Date;
    } | null;
  } | null;
};

type AdminsTableProps = {
  admins: Admin[];
};

type SortKey = "name" | "email" | "school" | "createdAt" | "status";

export function AdminsTable({ admins }: AdminsTableProps) {
  const { showToast } = useToastContext();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const columnConfig: Array<{
    key: SortKey | "actions";
    label: string;
    align?: "left" | "center" | "right";
  }> = [
    { key: "name", label: "담당자 이름" },
    { key: "email", label: "이메일" },
    { key: "school", label: "학교" },
    { key: "status", label: "상태", align: "center" },
    { key: "createdAt", label: "생성일" },
    { key: "actions", label: "작업", align: "center" },
  ];

  const sortedAdmins = useMemo(() => {
    const sorted = [...admins];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case "name":
          aValue = a.adminProfile?.school?.contactName || "";
          bValue = b.adminProfile?.school?.contactName || "";
          break;
        case "email":
          aValue = a.email;
          bValue = b.email;
          break;
        case "school":
          aValue = a.adminProfile?.school?.name || a.school || "";
          bValue = b.adminProfile?.school?.name || b.school || "";
          break;
        case "status":
          aValue = a.adminProfile?.school?.status || "active";
          bValue = b.adminProfile?.school?.status || "active";
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
  }, [admins, sortConfig]);

  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAdmins.slice(start, start + pageSize);
  }, [sortedAdmins, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedAdmins.length / pageSize);

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

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingAdmin(null);
    // 페이지 새로고침으로 최신 데이터 가져오기
    window.location.reload();
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditingAdmin(null);
  };

  const handleDelete = (admin: Admin) => {
    setDeletingAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAdmin) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/delete-admin", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId: deletingAdmin.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "Admin 계정 삭제에 실패했습니다.", "error");
        return;
      }

      showToast("Admin 계정이 성공적으로 삭제되었습니다.", "success");
      setIsDeleteModalOpen(false);
      setDeletingAdmin(null);
      // 페이지 새로고침으로 최신 데이터 가져오기
      window.location.reload();
    } catch (error) {
      showToast("Admin 계정 삭제 중 오류가 발생했습니다.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingAdmin(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Admin 계정 목록</h3>
        <p className="text-sm text-gray-500 mt-1">총 {admins.length}개의 Admin 계정</p>
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
                  onClick={() => {
                    if (column.key !== "actions") {
                      handleSort(column.key as SortKey);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
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
            {paginatedAdmins.length === 0 ? (
              <tr>
                <td colSpan={columnConfig.length} className="px-6 py-12 text-center text-gray-500">
                  Admin 계정이 없습니다.
                </td>
              </tr>
            ) : (
              paginatedAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {admin.adminProfile?.school?.contactName || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{admin.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {admin.adminProfile?.school?.name || admin.school || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(admin.adminProfile?.school?.status || "active")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(admin.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(admin)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        title="수정"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(admin)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 수정 모달 */}
      {isEditModalOpen && editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Admin 계정 수정</h3>
                <button
                  onClick={handleEditCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <EditAdminForm
                admin={editingAdmin}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Admin 계정 삭제</h3>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isDeleting}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  다음 Admin 계정을 삭제하시겠습니까?
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {deletingAdmin.name || "-"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {deletingAdmin.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    {deletingAdmin.adminProfile?.school?.name || deletingAdmin.school || "-"}
                  </p>
                </div>
                <p className="text-sm text-red-600 mt-4">
                  ⚠️ 이 작업은 되돌릴 수 없습니다. 관련된 학교 정보와 Admin 프로필도 함께 삭제됩니다.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting && (
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

