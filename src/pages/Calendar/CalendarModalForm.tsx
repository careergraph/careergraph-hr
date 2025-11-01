import {
  CALENDAR_LEVELS,
  CALENDAR_LEVEL_META,
  CALENDAR_VARIANT_STYLES,
  CalendarLevel,
} from "../../lib/calendar-utils";
import { CalendarEvent } from "@/types/calendar";

import { Modal } from "@/components/custom/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock } from "lucide-react";

// CalendarModalForm xử lý việc tạo và chỉnh sửa lịch hẹn thông qua modal.

interface CalendarModalFormProps {
  isOpen: boolean;
  editingEvent: CalendarEvent | null;
  eventTitle: string;
  eventCandidate: string;
  eventLevel: CalendarLevel;
  eventStartDate: string;
  eventEndDate: string;
  eventLocation: string;
  eventNotes: string;
  onClose: () => void;
  onSubmit: () => void;
  onTitleChange: (value: string) => void;
  onCandidateChange: (value: string) => void;
  onLevelChange: (level: CalendarLevel) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

export const CalendarModalForm = ({
  isOpen,
  editingEvent,
  eventTitle,
  eventCandidate,
  eventLevel,
  eventStartDate,
  eventEndDate,
  eventLocation,
  eventNotes,
  onClose,
  onSubmit,
  onTitleChange,
  onCandidateChange,
  onLevelChange,
  onStartDateChange,
  onEndDateChange,
  onLocationChange,
  onNotesChange,
}: CalendarModalFormProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[760px] p-0">
      <div className="flex max-h-[80vh] flex-col overflow-hidden rounded-3xl bg-card">
        {/* Nội dung modal để nhập chi tiết, thời gian và ghi chú sự kiện. */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {editingEvent ? "Chỉnh sửa lịch hẹn" : "Tạo lịch phỏng vấn"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Ghi rõ thông tin để ứng viên và đội ngũ phối hợp hiệu quả.
            </p>
          </div>
          <Badge className="bg-brand-500/10 text-brand-600 pr-15">
            <CalendarClock className="mr-1 size-3.5" />
            Lịch tuyển dụng
          </Badge>
        </div>
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="grid gap-5 pr-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-title">
                  Tiêu đề lịch
                </label>
                <Input
                  id="event-title"
                  value={eventTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Ví dụ: Phỏng vấn vòng 2 - Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-candidate">
                  Ứng viên
                </label>
                <Input
                  id="event-candidate"
                  value={eventCandidate}
                  onChange={(e) => onCandidateChange(e.target.value)}
                  placeholder="Nhập tên ứng viên"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Nhóm lịch</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {CALENDAR_LEVELS.map((level) => {
                  const variant = CALENDAR_LEVEL_META[level].variant;
                  const styles = CALENDAR_VARIANT_STYLES[variant];
                  const active = eventLevel === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => onLevelChange(level)}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 ${
                        active
                          ? "border-transparent bg-brand-500/10 shadow-sm"
                          : "border-border/60 bg-background/60 hover:bg-background"
                      }`}
                    >
                      <span className={`mt-1 size-2.5 rounded-full ${styles.indicator}`} />
                      <span>
                        <span className="block text-sm font-semibold text-foreground">
                          {CALENDAR_LEVEL_META[level].label}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {CALENDAR_LEVEL_META[level].description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-start-date">
                  Ngày bắt đầu
                </label>
                <Input
                  id="event-start-date"
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-end-date">
                  Ngày kết thúc
                </label>
                <Input
                  id="event-end-date"
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-location">
                  Địa điểm / Hình thức
                </label>
                <Input
                  id="event-location"
                  value={eventLocation}
                  onChange={(e) => onLocationChange(e.target.value)}
                  placeholder="Ví dụ: Google Meet / Văn phòng"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-notes">
                  Ghi chú
                </label>
                <Textarea
                  id="event-notes"
                  value={eventNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Thông tin thêm để ứng viên và interviewer nắm rõ"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex flex-wrap justify-end gap-3 border-t border-border/60 px-6 py-5">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={onSubmit}>
            {editingEvent ? "Lưu thay đổi" : "Tạo lịch"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
