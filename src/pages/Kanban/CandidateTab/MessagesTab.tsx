import CandidateMessageTab from "@/features/messaging/components/CandidateMessageTab";
import type { Candidate } from "@/types/candidate";

type MessagesTabProps = {
  candidate: Candidate;
};

export function MessagesTab({ candidate }: MessagesTabProps) {
  return (
    <div className="h-full bg-white">
      <CandidateMessageTab
        candidateId={candidate.candidateId}
        applicationId={candidate.id}
      />
    </div>
  );
}
