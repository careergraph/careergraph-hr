import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { StepIndicator } from "../AddJobSteps/StepIndicator";
import { JobDetailsStep } from "../AddJobSteps/JobDetailsStep";
import { ApplicationRequirementsStep } from "../AddJobSteps/ApplicationRequirementsStep";
import { Job } from "@/types/job";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { jobService, type JobRecruitmentPayload } from "@/services/jobService";
import { Status } from "@/enums/commonEnum";
import {
  EDUCATION_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  JOB_CATEGORY_OPTIONS,
} from "@/enums/workEnum";

// AddJob điều phối quy trình tạo job nhiều bước gồm lưu nháp và công khai.

const AddJob = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draftId") ?? "";
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
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // const steps = ["Information", "Requirements", "Promote"];
  const steps = ["Thông tin", "Yêu cầu ứng tuyển"];

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

  const isUpdateNotImplementedError = (error: unknown) => {
    const message = resolveErrorMessage(error).toLowerCase();
    return message.includes("update job not implemented yet");
  };

  const normalizeEnumCode = (value?: string | null) => {
    if (!value) return undefined;
    return value
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[â€™'`]/g, "")
      .replace(/[-\s]+/g, "_")
      .toUpperCase();
  };

  const buildOptionLookup = <T extends string>(
    options: { value: T; label: string }[]
  ) =>
    options.reduce<Record<string, T>>((acc, option) => {
      acc[normalizeEnumCode(option.value) ?? option.value] = option.value;
      acc[normalizeEnumCode(option.label) ?? option.value] = option.value;
      return acc;
    }, {} as Record<string, T>);

  const experienceLevelLookup = {
    ...buildOptionLookup(EXPERIENCE_LEVEL_OPTIONS),
    MOI_TOT_NGHIEP: "FRESHER",
    NHAN_VIEN_JUNIOR: "JUNIOR",
    NHAN_VIEN_SENIOR: "SENIOR",
    TRUONG_NHOM: "LEADER",
  };

  const employmentTypeLookup = {
    ...buildOptionLookup(EMPLOYMENT_TYPE_OPTIONS),
    FULLTIME: "FULL_TIME",
    PARTTIME: "PART_TIME",
  };

  const educationLookup = {
    ...buildOptionLookup(EDUCATION_OPTIONS),
    ASSOCIATE_DEGREE: "ASSOCIATE",
    BACHELORS_DEGREE: "BACHELOR",
    MASTERS_DEGREE: "MASTER",
    OTHER: "NONE",
  };

  const jobCategoryLookup = {
    ...buildOptionLookup(JOB_CATEGORY_OPTIONS),
    ENGINEERING: "ENGINEER",
    ART_AND_MUSIC: "ART_MUSIC",
    ADMIN: "ADMINISTRATION",
    TRAINING: "EDUCATION",
    CUSTOMER_SUCCESS: "CUSTOMER_SERVICE",
    SUPPORT: "CUSTOMER_SERVICE",
    PRODUCTION: "MANUFACTURING",
    SOFTWARE: "TECHNOLOGY",
    SOFTWARE_ENGINEERING: "TECHNOLOGY",
    BUSINESS_OPERATIONS: "BUSINESS",
  };

  const resolveOptionValue = <T extends string>(
    value: string | null | undefined,
    lookup: Record<string, T>
  ): T | undefined => {
    const normalized = normalizeEnumCode(value);
    if (!normalized) return undefined;
    return lookup[normalized];
  };

  const normalizeEducationCode = (value?: string | null) => {
    return resolveOptionValue(value, educationLookup);
  };

  const normalizeNumber = (value: unknown) => {
    if (value === null || value === undefined || value === "") return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  useEffect(() => {
    if (!draftId) return;

    let mounted = true;

    const loadDraft = async () => {
      setIsLoadingDraft(true);
      try {
        const data = await jobService.getJobById(draftId);
        if (!mounted || !data) return;

        setJobData((prev) => ({
          ...prev,
          ...data,
          id: data.id ?? draftId,
          experienceLevel:
            resolveOptionValue(
              (data as { experienceLevel?: string }).experienceLevel,
              experienceLevelLookup
            ) ??
            prev.experienceLevel,
          employmentType:
            resolveOptionValue(
              (data as { employmentType?: string }).employmentType ??
                (data as { type?: string }).type,
              employmentTypeLookup
            ) ??
            prev.employmentType,
          type:
            resolveOptionValue(
              (data as { type?: string }).type ??
                (data as { employmentType?: string }).employmentType,
              employmentTypeLookup
            ) ??
            prev.type,
          jobCategory:
            resolveOptionValue(
              (data as { jobCategory?: string }).jobCategory,
              jobCategoryLookup
            ) ??
            prev.jobCategory,
          education:
            normalizeEducationCode((data as { education?: string }).education) ??
            prev.education,
          minExperience:
            normalizeNumber((data as { minExperience?: unknown }).minExperience) ??
            prev.minExperience,
          maxExperience:
            normalizeNumber((data as { maxExperience?: unknown }).maxExperience) ??
            prev.maxExperience,
          specific: (data as { address?: string; specific?: string }).specific
            ?? (data as { address?: string; specific?: string }).address
            ?? prev.specific,
          applicationRequirements: {
            resume:
              (data as { resume?: boolean }).resume ??
              prev.applicationRequirements?.resume ??
              true,
            coverLetter:
              (data as { coverLetter?: boolean }).coverLetter ??
              prev.applicationRequirements?.coverLetter ??
              true,
          },
        }));
      } catch (error) {
        const message = resolveErrorMessage(error);
        toast.error(message);
      } finally {
        if (mounted) {
          setIsLoadingDraft(false);
        }
      }
    };

    loadDraft();

    return () => {
      mounted = false;
    };
  }, [draftId]);

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
      if (jobData.id && isUpdateNotImplementedError(error)) {
        // BE chưa hỗ trợ update draft: cho phép tiếp tục flow nếu người dùng chỉ muốn đi tiếp.
        setJobData((prev) => ({
          ...prev,
          ...payload,
          status: Status.DRAFT,
        }));
        toast.info("Bản nháp hiện chưa hỗ trợ cập nhật tại bước này. Đang chuyển sang bước tiếp theo.");
        setCurrentStep(2);
        return;
      }

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
      const message = "Không tìm thấy bản nháp để cập nhật yêu cầu ứng tuyển.";
      toast.error(message);
      throw new Error(message);
    }

    setIsSavingRequirements(true);
    try {
      const recruitmentPayload: JobRecruitmentPayload = {
        jobId,
        coverLetter: Boolean(payload.applicationRequirements?.coverLetter ?? true),
      };

      await jobService.updateRecruitment(recruitmentPayload);

      // Lưu yêu cầu ứng tuyển vào state dùng cho bước tiếp theo.
      setJobData((prev) => ({
        ...prev,
        ...payload,
        applicationRequirements: {
          resume: true,
          coverLetter: recruitmentPayload.coverLetter,
        },
      }));

      toast.success("Đã lưu yêu cầu ứng tuyển.");
      await handlePublish({
        ...payload,
        promotionType: "free",
      });
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
              isSubmitting={isSavingDraft || isLoadingDraft}
            />
          )}
          {currentStep === 2 && (
            <ApplicationRequirementsStep
              jobData={jobData}
              onUpdate={handleJobDataUpdate}
              onNext={handleRequirementsNext}
              onBack={handleBack}
              isSubmitting={isSavingRequirements || isPublishing}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddJob;
