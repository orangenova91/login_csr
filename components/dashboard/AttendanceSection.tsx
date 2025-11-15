"use client";

import { useState } from "react";
import AttendanceHeader from "./AttendanceHeader";
import ClassGroupList from "./ClassGroupList";

type Student = {
  id: string;
  name: string | null;
  email: string;
};

type AttendanceSectionProps = {
  courseId: string;
  students: Student[];
};

export default function AttendanceSection({
  courseId,
  students,
}: AttendanceSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <>
      <AttendanceHeader
        courseId={courseId}
        students={students}
        onDateChange={setSelectedDate}
      />
      <div className="space-y-4">
        <ClassGroupList
          courseId={courseId}
          students={students}
          selectedDate={selectedDate}
        />
      </div>
    </>
  );
}

