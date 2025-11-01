import { useState } from "react";
import { isAxiosError } from "axios";
import { StepIndicator } from "../AddJobSteps/StepIndicator";
import { JobDetailsStep } from "../AddJobSteps/JobDetailsStep";
import { ApplicationRequirementsStep } from "../AddJobSteps/ApplicationRequirementsStep";
import { PromoteStep } from "../AddJobSteps/PromoteStep";
import { Job } from "@/types/job";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { jobService } from "@/services/jobService";
import { Status } from "@/enums/commonEnum";

// AddJob điều phối quy trình tạo job nhiều bước gồm lưu nháp và công khai.

const AddJob = () => {
  const navigate = useNavigate();
  // Theo dõi bước hiện tại của wizard.
  const [currentStep, setCurrentStep] = useState(1);
  // Lưu dữ liệu job tích lũy qua các bước.
  const [jobData, setJobData] = useState<Partial<Job>>({
    status: Status.DRAFT,
  });
  // Các cờ trạng thái để disable nút khi đang gọi API.
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingRequirements, setIsSavingRequirements] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const steps = ["Information", "Requirements", "Promote"];

  const handleJobDataUpdate = (data: Partial<Job>) => {
    // Gộp dữ liệu mới vào state job hiện tại.
    setJobData((prev) => ({ ...prev, ...data }));
  };

  const handleBack = () => {
    // Quay lại bước trước nhưng không nhỏ hơn 1.
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const extractJobId = (data: unknown): string | undefined => {
    // Lấy id job từ nhiều dạng phản hồi khác nhau.
    if (!data || typeof data !== "object") return undefined;

    if ("id" in data && typeof (data as Record<string, unknown>).id === "string") {
      return (data as { id: string }).id;
    }

    if ("jobId" in data && typeof (data as Record<string, unknown>).jobId === "string") {
      return (data as { jobId: string }).jobId;
    }

    return undefined;
  };

  const resolveErrorMessage = (error: unknown) => {
    // Trả về thông báo lỗi dễ hiểu từ phản hồi API hoặc lỗi hệ thống.
    if (isAxiosError(error)) {
      const data = error.response?.data as { message?: string; error?: string } | undefined;
      return data?.message ?? data?.error ?? "Không thể xử lý yêu cầu. Vui lòng thử lại.";
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Không thể xử lý yêu cầu. Vui lòng thử lại.";
  };

  const handleJobDetailsNext = async (payload: Partial<Job>) => {
    setIsSavingDraft(true);
    try {
      const jobId = jobData.id;

      const draftResponse = jobId
        ? await jobService.updateJob(jobId, {
            ...jobData,
            ...payload,
            status: Status.DRAFT,
          })
        : await jobService.createDraft({
            ...jobData,
            ...payload,
            status: Status.DRAFT,
          });

      const nextJobId = jobId ?? extractJobId(draftResponse);

      setJobData((prev) => ({
        ...prev,
        ...payload,
        id: nextJobId ?? prev.id,
        status: Status.DRAFT,
      }));

      toast.success("Đã lưu bản nháp công việc.");
      setCurrentStep(2);
    } catch (error) {
      const message = resolveErrorMessage(error);
      toast.error(message);
      throw error;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleRequirementsNext = async (payload: Partial<Job>) => {
    setIsSavingRequirements(true);
    try {
      // Lưu yêu cầu ứng tuyển vào state dùng cho bước tiếp theo.
      setJobData((prev) => ({
        ...prev,
        ...payload,
      }));

      setCurrentStep(3);
    } finally {
      setIsSavingRequirements(false);
    }
  };

  const handlePublish = async (payload: Partial<Job>) => {
    const jobId = jobData.id;

    if (!jobId) {
      const message = "Không tìm thấy bản nháp để công khai.";
      toast.error(message);
      throw new Error(message);
    }

    setIsPublishing(true);
    try {
      // Gọi API publish với dữ liệu hoàn thiện.
      await jobService.publishJob(jobId, {
        ...jobData,
        ...payload,
      });

      setJobData((prev) => ({
        ...prev,
        ...payload,
        status: Status.ACTIVE,
      }));

      toast.success("Job đã được đăng tải trên nền tảng!");
      // Sau khi publish thành công chuyển về trang danh sách job.
      navigate("/jobs", { replace: true });
    } catch (error) {
      const message = resolveErrorMessage(error);
      toast.error(message);
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {/* Bố cục chứa wizard ba bước và dữ liệu được duy trì giữa các bước. */}
      <div className="max-w-4xl mx-auto">
        <StepIndicator currentStep={currentStep} steps={steps} />

        <div className="bg-card rounded-lg shadow-sm border p-8">
          {currentStep === 1 && (
            <JobDetailsStep
              jobData={jobData}
              onUpdate={handleJobDataUpdate}
              onNext={handleJobDetailsNext}
              isSubmitting={isSavingDraft}
            />
          )}
          {currentStep === 2 && (
            <ApplicationRequirementsStep
              jobData={jobData}
              onUpdate={handleJobDataUpdate}
              onNext={handleRequirementsNext}
              onBack={handleBack}
              isSubmitting={isSavingRequirements}
            />
          )}
          {currentStep === 3 && (
            <PromoteStep
              jobData={jobData}
              onUpdate={handleJobDataUpdate}
              onSubmit={handlePublish}
              onBack={handleBack}
              isSubmitting={isPublishing}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddJob;
