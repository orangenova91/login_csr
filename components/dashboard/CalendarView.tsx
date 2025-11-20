"use client";

import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DateSelectArg, EventInput } from "@fullcalendar/core";
import EventModal from "./EventModal";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/providers/ToastProvider";
import "@/app/calendar.css"; // FullCalendar 스타일

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end?: string | null;
  allDay: boolean;
  extendedProps: {
    eventType: string;
    scope: string;
    school?: string;
    courseId?: string;
  };
}

type CalendarViewProps = {
  initialEvents?: CalendarEvent[];
};

export default function CalendarView({ initialEvents = [] }: CalendarViewProps) {
  const { showToast } = useToastContext();
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [calendarRef, setCalendarRef] = useState<FullCalendar | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 일정 목록 새로고침
  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!calendarRef) return;

      const calendarApi = calendarRef.getApi();
      const start = calendarApi.view.activeStart.toISOString();
      const end = calendarApi.view.activeEnd.toISOString();

      const response = await fetch(
        `/api/calendar-events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&scope=all`
      );

      if (!response.ok) {
        throw new Error("일정을 불러올 수 없습니다.");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Failed to refresh events:", error);
      showToast("일정을 불러오는 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [calendarRef, showToast]);

  // 날짜 범위 변경 시 일정 새로고침
  const handleDatesSet = useCallback(() => {
    refreshEvents();
  }, [refreshEvents]);

  // 일정 클릭
  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventData: CalendarEvent = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      description: clickInfo.event.extendedProps.description,
      start: clickInfo.event.start?.toISOString() || "",
      end: clickInfo.event.end?.toISOString() || null,
      allDay: clickInfo.event.allDay,
      extendedProps: clickInfo.event.extendedProps,
    };
    setSelectedEvent(eventData);
    setIsModalOpen(true);
  };

  // 날짜/시간 선택 (일정 추가)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start);
    
    // 종료 날짜 처리: FullCalendar의 end는 exclusive이므로 하루를 빼야 실제 종료 날짜가 됨
    if (selectInfo.end) {
      const endDate = new Date(selectInfo.end);
      endDate.setDate(endDate.getDate() - 1); // 하루 빼서 실제 종료 날짜로 만듦
      setSelectedEndDate(endDate);
    } else {
      setSelectedEndDate(null);
    }
    
    setSelectedEvent(null);
    setIsModalOpen(true);
    // 선택 해제
    selectInfo.view.calendar.unselect();
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    setSelectedEndDate(null);
  };

  // 일정 저장 성공
  const handleEventSaved = () => {
    handleCloseModal();
    refreshEvents();
    showToast("일정이 저장되었습니다.", "success");
  };

  // 일정 삭제 성공
  const handleEventDeleted = () => {
    handleCloseModal();
    refreshEvents();
    showToast("일정이 삭제되었습니다.", "success");
  };

  // FullCalendar 이벤트 형식으로 변환
  const calendarEvents: EventInput[] = events.map((event) => {
    // 일정 유형별 색상
    const colors: Record<string, string> = {
      평가: "#dc2626", // red
      행사: "#2563eb", // blue
      휴업일: "#16a34a", // green
      개인일정: "#ca8a04", // yellow
      기타: "#6b7280", // gray
    };

    return {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end || undefined,
      allDay: event.allDay,
      backgroundColor: colors[event.extendedProps.eventType] || colors["기타"],
      borderColor: colors[event.extendedProps.eventType] || colors["기타"],
      extendedProps: event.extendedProps,
      description: event.description,
    };
  });

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">학사일정</h2>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedDate(new Date());
            setSelectedEndDate(null);
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
        >
          일정 추가
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <FullCalendar
          ref={(ref) => setCalendarRef(ref)}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="ko"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={calendarEvents}
          eventClick={handleEventClick}
          select={handleDateSelect}
          datesSet={handleDatesSet}
          height="auto"
          eventDisplay="block"
          dayHeaderFormat={{ weekday: "short" }}
          buttonText={{
            today: "오늘",
            month: "월",
            week: "주",
            day: "일",
          }}
        />
      </div>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          event={selectedEvent}
          selectedDate={selectedDate}
          selectedEndDate={selectedEndDate}
          onSaved={handleEventSaved}
          onDeleted={handleEventDeleted}
        />
      )}
    </div>
  );
}

