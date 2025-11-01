import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

// CvTab hiển thị hành động liên quan đến hồ sơ CV của ứng viên.

export function CvTab() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-slate-50 px-6 text-center sm:px-8">
      {/* Biểu tượng và mô tả trạng thái CV. */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileText className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-700">Hồ sơ ứng viên</h3>
        <p className="text-sm text-slate-500">
          CV hiện chưa được liên kết. Bạn có thể yêu cầu ứng viên cập nhật hoặc tải lên thủ công.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Hành động yêu cầu hoặc tải lên CV. */}
        <Button variant="default">Yêu cầu cập nhật CV</Button>
        <Button variant="outline">Tải CV từ thiết bị</Button>
      </div>
    </div>
  );
}
