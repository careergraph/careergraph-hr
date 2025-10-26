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

const AddJob = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [jobData, setJobData] = useState<Partial<Job>>({
    status: Status.DRAFT,
  });
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingRequirements, setIsSavingRequirements] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const steps = ["Information", "Requirements", "Promote"];

  const handleJobDataUpdate = (data: Partial<Job>) => {
    setJobData((prev) => ({ ...prev, ...data }));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const extractJobId = (data: unknown): string | undefined => {
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
    const jobId = jobData.id;

    if (!jobId) {
      const message = "Không tìm thấy thông tin bản nháp. Vui lòng hoàn tất bước trước.";
      toast.error(message);
      throw new Error(message);
    }

    setIsSavingRequirements(true);
    try {
      await jobService.updateJob(jobId, {
        ...jobData,
        ...payload,
      });

      setJobData((prev) => ({
        ...prev,
        ...payload,
      }));

      toast.success("Đã lưu yêu cầu ứng tuyển.");
      setCurrentStep(3);
    } catch (error) {
      const message = resolveErrorMessage(error);
      toast.error(message);
      throw error;
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
      await jobService.publishJob(jobId, {
        ...jobData,
        ...payload,
        status: Status.ACTIVE,
      });

      setJobData((prev) => ({
        ...prev,
        ...payload,
        status: Status.ACTIVE,
      }));

      toast.success("Job posted successfully!");
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
