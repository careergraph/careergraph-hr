import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Job, ApplicationRequirements } from "@/types/job";

// ApplicationRequirementsStep cấu hình giấy tờ và câu hỏi sàng lọc bắt buộc cho ứng viên.

interface ApplicationRequirementsStepProps {
  jobData: Partial<Job>;
  onUpdate: (data: Partial<Job>) => void;
  onNext: (data: Partial<Job>) => Promise<void> | void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const ApplicationRequirementsStep = ({
  jobData,
  onUpdate,
  onNext,
  onBack,
  isSubmitting = false,
}: ApplicationRequirementsStepProps) => {
  const [requirements, setRequirements] = useState<ApplicationRequirements>(
    jobData.applicationRequirements
      ? {
          resume: true,
          coverLetter:
            jobData.applicationRequirements.coverLetter ?? true,
        }
      : {
          resume: true,
          coverLetter: true,
        }
  );

  const requirementItemClass =
    "flex items-center justify-between px-5 py-4 rounded-xl border border-border/60 bg-card/40 dark:bg-slate-900/40 hover:border-primary/30 transition-colors shadow-sm";

  const handleRequirementChange = (
    field: keyof ApplicationRequirements,
    value: boolean
  ) => {
    setRequirements({
      ...requirements,
      [field]: value,
    });
  };
  const handleNext = async () => {
    const updatedRequirements: ApplicationRequirements = {
      resume: true,
      coverLetter: requirements.coverLetter,
    };

    setRequirements(updatedRequirements);
    const payload = {
      ...jobData,
      applicationRequirements: updatedRequirements,
    };

    onUpdate(payload);

    try {
      await onNext(payload);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Danh sách tùy chỉnh các giấy tờ bắt buộc và câu hỏi bổ sung cho ứng viên. */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 dark:bg-slate-900/40 px-6 py-5 shadow-sm">
        <h2 className="text-2xl font-semibold mb-2">Thông tin ứng tuyển</h2>
        <p className="text-muted-foreground text-sm">
          Lựa chọn những thành phần bắt buộc trên biểu mẫu ứng viên cần cung cấp.
        </p>
      </div>

      <div className="space-y-4">
        <div className={requirementItemClass}>
          <Label
            htmlFor="resume"
            className="text-base font-medium cursor-pointer"
          >
            Resume
          </Label>
          <Checkbox
            id="resume"
            checked={requirements.resume}
            disabled
            className="h-6 w-6"
          />
        </div>

        <div className={requirementItemClass}>
          <Label
            htmlFor="coverLetter"
            className="text-base font-medium cursor-pointer"
          >
            Cover Letter
          </Label>
          <Checkbox
            id="coverLetter"
            checked={requirements.coverLetter}
            onCheckedChange={(checked) =>
              handleRequirementChange("coverLetter", checked as boolean)
            }
            className="h-6 w-6"
          />
        </div>
      </div>

      <div className="pt-8 rounded-2xl border border-dashed border-border/60 bg-muted/10 dark:bg-slate-900/40 px-6 py-6">
        <h3 className="text-xl font-semibold mb-2">
          Câu hỏi sàng lọc ứng viên (Tuỳ chọn)
        </h3>
        <p className="text-muted-foreground text-sm">
          Tính năng câu hỏi sàng lọc sẽ được bổ sung trong phiên bản tiếp theo.
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 pt-6">
        <div className="flex w-full items-center justify-between">
          <div className="inline-flex items-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium p-1">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="px-4 py-2 text-blue-700 hover:text-blue-800"
            >
              ← Quay lại
            </Button>
          </div>
          <div className="inline-flex items-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium p-1">
            <Button
              onClick={handleNext}
              size="sm"
              className="px-4 py-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "Tiếp tục"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
