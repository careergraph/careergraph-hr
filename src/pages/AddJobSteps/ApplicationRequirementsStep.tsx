import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

  const generateId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const handleAddQuestion = () => {
    setRequirements((prev) => ({
      ...prev,
      screeningQuestions: [
        ...(prev.screeningQuestions || []),
        {
          id: generateId(),
          question: "",
          type: "text" as const,
          required: false,
        },
      ],
    }));
  };

  const handleQuestionChange = (id: string, value: string) => {
    setRequirements((prev) => ({
      ...prev,
      screeningQuestions: (prev.screeningQuestions || []).map((question) =>
        question.id === id ? { ...question, question: value } : question
      ),
    }));
  };

  const handleQuestionRequiredChange = (id: string, value: boolean) => {
    setRequirements((prev) => ({
      ...prev,
      screeningQuestions: (prev.screeningQuestions || []).map((question) =>
        question.id === id ? { ...question, required: value } : question
      ),
    }));
  };

  const handleQuestionRemove = (id: string) => {
    setRequirements((prev) => ({
      ...prev,
      screeningQuestions: (prev.screeningQuestions || []).filter(
        (question) => question.id !== id
      ),
    }));
  };

  const isStepValid = requirements.resume && requirements.coverLetter;
  const handleNext = async () => {
    setTouched(true);
    if (!isStepValid) return;
    const sanitizedQuestions = (requirements.screeningQuestions || [])
      .map((question) => ({
        ...question,
        question: question.question.trim(),
      }))
      .filter((question) => question.question.length > 0);

    const updatedRequirements: ApplicationRequirements = {
      ...requirements,
      screeningQuestions: sanitizedQuestions,
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

      <div className="pt-8 rounded-2xl border border-dashed border-border/60 bg-muted/10 dark:bg-slate-900/40 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">
            Câu hỏi sàng lọc ứng viên (Tuỳ chọn)
          </h3>
          <Button variant="ghost" size="sm" onClick={handleAddQuestion}>
            + Thêm tiêu chí
          </Button>
        </div>

        {(requirements.screeningQuestions || []).length > 0 ? (
          <div className="space-y-3">
            {(requirements.screeningQuestions || []).map((question) => (
              <div
                key={question.id}
                className="rounded-xl border border-border/60 bg-card/40 dark:bg-slate-900/40 px-4 py-3 shadow-sm"
              >
                <Input
                  placeholder="Nhập tiêu chí hoặc câu hỏi"
                  value={question.question}
                  onChange={(event) =>
                    handleQuestionChange(question.id, event.target.value)
                  }
                  className="mb-3"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`required-${question.id}`}
                      checked={question.required}
                      onCheckedChange={(checked) =>
                        handleQuestionRequiredChange(
                          question.id,
                          checked as boolean
                        )
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor={`required-${question.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      Bắt buộc
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuestionRemove(question.id)}
                  >
                    Xoá
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Bạn có thể bổ sung danh sách câu hỏi để sàng lọc ứng viên ngay tại đây hoặc thêm sau khi tạo job.
          </p>
        )}
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
              disabled={!isStepValid || isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "Tiếp tục"}
            </Button>
          </div>
        </div>
        {!isStepValid && touched && (
          <p className="text-xs text-red-500 text-right w-full">
            Resume và Cover Letter là bắt buộc.
          </p>
        )}
      </div>
    </div>
  );
};
