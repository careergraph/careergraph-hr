import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import { Job } from "@/types/job";

interface PromoteStepProps {
  jobData: Partial<Job>;
  onUpdate: (data: Partial<Job>) => void;
  onSubmit: (data: Partial<Job>) => Promise<void> | void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const PromoteStep = ({
  jobData,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting = false,
}: PromoteStepProps) => {
  const [promotionType, setPromotionType] = useState<"free" | "paid">(
    jobData.promotionType || "free"
  );

  const handlePromote = async () => {
    const payload = {
      ...jobData,
      promotionType,
    };

    onUpdate(payload);

    try {
      await onSubmit(payload);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/60 bg-muted/20 dark:bg-slate-900/40 px-6 py-5 shadow-sm">
        <h2 className="text-2xl font-semibold mb-2">Quảng bá tuyển dụng</h2>
        <p className="text-sm text-muted-foreground">
          Giúp tin tuyển dụng nổi bật và tiếp cận nhiều ứng viên hơn bằng cách chọn gói hiển thị phù hợp.
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold flex items-center gap-1">
          Gói hiển thị<span className="text-destructive">*</span>
        </Label>
        <Select
          value={promotionType}
          onValueChange={(value) => setPromotionType(value as "free" | "paid")}
        >
          <SelectTrigger className="mt-2 h-14 border-border/60 bg-card/40 dark:bg-slate-900/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-900 z-50">
            <SelectItem value="free">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Công khai</span>
                <span className="text-muted-foreground">(Miễn phí)</span>
              </div>
            </SelectItem>
            <SelectItem value="paid">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Tối ưu hiển thị</span>
                <span className="text-muted-foreground">(Có phí)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {promotionType === "free" ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50 dark:border-emerald-700/40 dark:bg-emerald-900/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            <span>Hiển thị trong kết quả tìm kiếm và trang danh sách việc làm.</span>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            <Check className="h-4 w-4" />
            <span>Ưu tiên xuất hiện nổi bật và được gợi ý cho ứng viên phù hợp.</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 dark:bg-slate-900/40 px-6 py-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Tùy chọn nâng cao</h3>
        <p className="text-sm text-muted-foreground">
          Các gói quảng cáo nâng cao sẽ sớm ra mắt. Hãy theo dõi để cập nhật những ưu đãi mới nhất.
        </p>
      </div>

      <div className="flex items-center justify-between pt-6">
        <div className="inline-flex items-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium p-1">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="px-4 py-2 text-blue-700 hover:text-blue-800"
          >
            ← Quay lại chỉnh sửa
          </Button>
        </div>
        <div className="inline-flex items-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium p-1">
          <Button
            onClick={handlePromote}
            size="sm"
            className="px-4 py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang đăng..." : "Hoàn tất đăng tuyển"}
          </Button>
        </div>
      </div>
    </div>
  );
};
