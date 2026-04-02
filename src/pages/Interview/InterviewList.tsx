import { useEffect, useState, useCallback } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useInterviewStore } from "@/stores/interviewStore";
import InterviewCard from "./InterviewCard";
import FeedbackModal from "./FeedbackModal";
import type { Interview} from "@/types/interview";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { interviewService } from "@/services/interviewService";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "SCHEDULED", label: "Đã lên lịch" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "PENDING_RESCHEDULE", label: "Chờ xác nhận lại" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export default function InterviewList() {
  const {
    interviews,
    isLoading,
    fetchInterviews,
    cancelInterview,
    completeInterview,
  } = useInterviewStore();

  const [statusFilter, setStatusFilter] = useState("");
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);

  useEffect(() => {
    fetchInterviews({ status: statusFilter || undefined });
  }, [statusFilter, fetchInterviews]);

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        await cancelInterview(id, "Hủy bởi HR");
        toast.success("Đã hủy phỏng vấn");
      } catch {
        toast.error("Không thể hủy phỏng vấn");
      }
    },
    [cancelInterview]
  );

  const handleComplete = useCallback(
    async (id: string) => {
      try {
        await completeInterview(id);
        toast.success("Đã hoàn thành phỏng vấn");
      } catch {
        toast.error("Không thể hoàn thành phỏng vấn");
      }
    },
    [completeInterview]
  );

  const handleAcceptProposal = useCallback(
    async (interviewId: string) => {
      try {
        const proposalsResp = await interviewService.fetchProposals(interviewId);
        const proposals = Array.isArray(proposalsResp?.data)
          ? proposalsResp.data
          : Array.isArray(proposalsResp)
            ? proposalsResp
            : [];

        const pendingProposal = proposals.find((p: { proposalStatus?: string }) => p?.proposalStatus === "PENDING");
        if (!pendingProposal?.id) {
          toast.warning("Không còn đề xuất lịch chờ duyệt");
          return;
        }

        await interviewService.acceptProposal(interviewId, pendingProposal.id);
        toast.success("Đã chấp nhận đề xuất lịch mới");
        await fetchInterviews({ status: statusFilter || undefined });
      } catch {
        toast.error("Không thể chấp nhận đề xuất");
      }
    },
    [fetchInterviews, statusFilter]
  );

  const handleRejectProposal = useCallback(
    async (interviewId: string) => {
      try {
        const proposalsResp = await interviewService.fetchProposals(interviewId);
        const proposals = Array.isArray(proposalsResp?.data)
          ? proposalsResp.data
          : Array.isArray(proposalsResp)
            ? proposalsResp
            : [];

        const pendingProposal = proposals.find((p: { proposalStatus?: string }) => p?.proposalStatus === "PENDING");
        if (!pendingProposal?.id) {
          toast.warning("Không còn đề xuất lịch chờ duyệt");
          return;
        }

        await interviewService.rejectProposal(interviewId, pendingProposal.id);
        toast.success("Đã từ chối đề xuất lịch mới");
        await fetchInterviews({ status: statusFilter || undefined });
      } catch {
        toast.error("Không thể từ chối đề xuất");
      }
    },
    [fetchInterviews, statusFilter]
  );

  return (
    <>
      <PageMeta title="Phỏng vấn | CareerGraph HR" description="Quản lý lịch phỏng vấn" />
      <PageBreadcrumb pageTitle="Phỏng vấn" />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Interview list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Chưa có phỏng vấn nào
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {interviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                onCancel={handleCancel}
                onComplete={handleComplete}
                onFeedback={(iv) => setFeedbackInterview(iv)}
                onAcceptReschedule={handleAcceptProposal}
                onRejectReschedule={handleRejectProposal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Feedback modal */}
      {feedbackInterview && (
        <FeedbackModal
          open={!!feedbackInterview}
          onClose={() => setFeedbackInterview(null)}
          interviewId={feedbackInterview.id}
          candidateName={feedbackInterview.candidateName}
        />
      )}
    </>
  );
}
