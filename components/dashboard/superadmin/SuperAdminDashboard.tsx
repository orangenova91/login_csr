"use client";

import { useState } from "react";
import { Users, Building2, UserPlus, School, Shield, Plus } from "lucide-react";
import CreateAdminForm from "@/components/dashboard/admin/CreateAdminForm";
import { AdminsTable } from "./AdminsTable";
import { SchoolsTable } from "./SchoolsTable";
import { Button } from "@/components/ui/Button";

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
      contactName: string;
      contactPhone: string;
      totalClasses: number | null;
      totalStudents: number | null;
      status: string;
      createdAt: Date;
    } | null;
  } | null;
};

type SchoolData = {
  id: string;
  name: string;
  adminUserId: string;
  createdBy: string;
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

type Stats = {
  adminCount: number;
  schoolCount: number;
  teacherCount: number;
  studentCount: number;
};

type SuperAdminDashboardProps = {
  admins: Admin[];
  schools: SchoolData[];
  stats: Stats;
};

export function SuperAdminDashboard({ admins, schools, stats }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "admins" | "schools" | "create">("overview");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setActiveTab("admins");
    // 페이지 새로고침으로 최신 데이터 가져오기
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-gray-500">Super Admin</p>
        <h1 className="text-3xl font-bold mt-1 text-gray-900">슈퍼어드민 대시보드</h1>
        <p className="text-gray-500 mt-2">시스템 전체 관리 및 Admin 계정 생성</p>
      </header>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab("overview");
              setShowCreateForm(false);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            개요
          </button>
          <button
            onClick={() => {
              setActiveTab("admins");
              setShowCreateForm(false);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "admins"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Admin 계정 ({admins.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("schools");
              setShowCreateForm(false);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "schools"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            학교 ({schools.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("create");
              setShowCreateForm(true);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "create"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Plus className="w-4 h-4" />
            Admin 생성
          </button>
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 통계 카드 */}
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Admin 계정</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.adminCount}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">등록된 학교</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.schoolCount}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">교사 계정</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.teacherCount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">학생 계정</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.studentCount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg">
                  <School className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={() => {
                  setActiveTab("create");
                  setShowCreateForm(true);
                }}
                className="flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                새 Admin 계정 생성
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "admins" && <AdminsTable admins={admins} />}

      {activeTab === "schools" && <SchoolsTable schools={schools} />}

      {activeTab === "create" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">새 Admin 계정 생성</h3>
          <CreateAdminForm
            onSuccess={handleCreateSuccess}
            onCancel={() => {
              setShowCreateForm(false);
              setActiveTab("overview");
            }}
          />
        </div>
      )}
    </div>
  );
}

