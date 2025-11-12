import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import type { CandidateMessagesResponse, MessageItem } from "@/types/candidateTab";

// MessagesTab cung cấp giao diện trao đổi trực tiếp với ứng viên.

type MessagesTabProps = {
  messagesData?: CandidateMessagesResponse | null;
  loading?: boolean;
  error?: string | null;
};

export function MessagesTab({ messagesData, loading, error }: MessagesTabProps) {
  return (
    <div className="flex h-full flex-col justify-between bg-white">
      {loading ? (
        <div className="px-6 pt-4 text-sm text-slate-500">Đang tải tin nhắn...</div>
      ) : error ? (
        <div className="ml-10 text-sm text-indigo-500">Thông báo: Tính năng đang trong quá trình hoàn thiện!</div>
      ) : messagesData ? (
        <div className="px-6 pt-4">
          {messagesData.messages?.length ? (
            <div className="space-y-3">
              {messagesData.messages.map((m: MessageItem) => (
                <div key={m.id} className={`rounded-xl border p-3 ${m.direction === "inbound" ? "bg-white" : "bg-slate-50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-700">{m.body}</p>
                      <p className="mt-1 text-xs text-slate-400">{m.sender ?? (m.direction === "inbound" ? "Ứng viên" : "Bạn")}</p>
                    </div>
                    <div className="text-xs text-slate-400">{m.createdAt}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">Chưa có cuộc trò chuyện nào.</div>
          )}
        </div>
      ) : null}
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
