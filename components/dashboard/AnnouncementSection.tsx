"use client";

import { AnnouncementComposer } from "./AnnouncementComposer";

interface AnnouncementSectionProps {
  authorName: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAnnouncementCreated?: () => void;
  editId?: string;
}

export function AnnouncementSection({ 
  authorName, 
  isOpen,
  onOpenChange,
  onAnnouncementCreated,
  editId
}: AnnouncementSectionProps) {
  const handleAnnouncementCreated = () => {
    onOpenChange?.(false);
    onAnnouncementCreated?.();
  };

  return (
    <AnnouncementComposer 
      authorName={authorName} 
      onPreview={handleAnnouncementCreated}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      showButton={false}
      editId={editId}
      onEditComplete={onAnnouncementCreated}
    />
  );
}

