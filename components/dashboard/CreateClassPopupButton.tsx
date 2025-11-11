"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import CreateClassForm from "@/components/dashboard/CreateClassForm";
import { Button } from "@/components/ui/Button";

type CreateClassModalButtonProps = {
  instructorName: string;
};

export default function CreateClassPopupButton({
  instructorName,
}: CreateClassModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleCreated = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <Button variant="primary" type="button" onClick={handleOpen}>
        수업 생성
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">수업 생성</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
              >
                닫기
              </button>
            </div>

            <div className="px-6 py-6">
              <CreateClassForm
                instructorName={instructorName}
                onSuccess={handleClose}
                onCreated={handleCreated}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

