import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Job, ApplicationRequirements } from "@/types/job";

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
  const [touched, setTouched] = useState(false);
  const [requirements, setRequirements] = useState<ApplicationRequirements>(
    jobData.applicationRequirements || {
      resume: true,
      coverLetter: true,
      photo: true,
      desiredSalary: false,
      screeningQuestions: [],
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

  const isStepValid = requirements.resume && requirements.coverLetter;
  const handleNext = async () => {
    setTouched(true);
    if (!isStepValid) return;
    const payload = {
      ...jobData,
      applicationRequirements: requirements,
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
            onCheckedChange={(checked) =>
              handleRequirementChange("resume", checked as boolean)
            }
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

        <div className={requirementItemClass}>
          <Label
            htmlFor="photo"
            className="text-base font-medium cursor-pointer"
          >
            Photo
          </Label>
          <Checkbox
            id="photo"
            checked={requirements.photo}
            onCheckedChange={(checked) =>
              handleRequirementChange("photo", checked as boolean)
            }
            className="h-6 w-6"
          />
        </div>

        <div className={requirementItemClass}>
          <Label
            htmlFor="desiredSalary"
            className="text-base font-medium cursor-pointer"
          >
            Desired Salary
          </Label>
          <Checkbox
            id="desiredSalary"
            checked={requirements.desiredSalary}
            onCheckedChange={(checked) =>
              handleRequirementChange("desiredSalary", checked as boolean)
            }
            className="h-6 w-6"
          />
        </div>
      </div>

      <div className="pt-8 rounded-2xl border border-dashed border-border/60 bg-muted/10 dark:bg-slate-900/40 px-6 py-6 text-center">
        <h3 className="text-xl font-semibold mb-2">
          Câu hỏi sàng lọc ứng viên
        </h3>
        <p className="text-muted-foreground text-sm">
          Bạn có thể bổ sung danh sách câu hỏi sau khi tạo job trong phần quản lý chi tiết.
        </p>
      </div>

      <div className="flex justify-between pt-6">
        <Button onClick={onBack} variant="outline" size="lg" className="px-8">
          Back
        </Button>
        <Button
          onClick={handleNext}
          size="lg"
          className="px-8"
          disabled={!isStepValid || isSubmitting}
        >
          {isSubmitting ? "Đang lưu..." : "Next"}
        </Button>
        {!isStepValid && touched && (
          <p className="text-xs text-red-500 mt-2 text-right w-full">Resume và Cover Letter là bắt buộc.</p>
        )}
      </div>
    </div>
  );
};
