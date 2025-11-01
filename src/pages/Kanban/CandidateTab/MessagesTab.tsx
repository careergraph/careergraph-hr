import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

// MessagesTab cung cấp giao diện trao đổi trực tiếp với ứng viên.

export function MessagesTab() {
  return (
    <div className="flex h-full flex-col justify-between bg-white">
      <ScrollArea className="h-full px-6 pt-5 sm:px-8">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
            Chưa có cuộc trò chuyện nào với ứng viên. Hãy sử dụng khung soạn thảo bên dưới để bắt đầu.
          </div>
        </div>
      </ScrollArea>
      {/* Khối nhập tin nhắn và gửi đi. */}
      <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Soạn tin nhắn nhanh
          </label>
          <textarea
            className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-inner outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            placeholder="Nhập nội dung trao đổi với ứng viên..."
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="border-slate-200 bg-white text-[11px] text-slate-500"
              >
                <MessageSquare className="mr-1 h-3.5 w-3.5" />
                Mẫu trả lời gợi ý
              </Badge>
            </div>
            <Button className="px-6">Gửi tin nhắn</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
