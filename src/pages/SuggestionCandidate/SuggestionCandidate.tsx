import { useState } from "react";
import { CandidateDetail } from "@/pages/SuggestionCandidate/CandidateDetail";
import { Candidate } from "@/types/candidate";
import { initialCandidates } from "@/data/candidateData";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CandidateHorizontalList from "@/pages/SuggestionCandidate/CandidateHorizontalList";
import SearchCandidate from "./SearchCandidate";

const SuggestionCandidate = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );

  // Search và filter candidate
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchQuery, setSearchQuery] = useState("");
  const filteredCandidates = initialCandidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background px-6 py-6">
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Tìm ứng viên" />

      {/* Search */}
      <SearchCandidate />

      {/* Top - Candidate List */}
      <CandidateHorizontalList
        candidates={filteredCandidates}
        selectedCandidate={selectedCandidate}
        setSelectedCandidate={setSelectedCandidate}
      />

      {/* Bottom - Candidate Detail */}
      <div className="w-full">
        <CandidateDetail candidate={selectedCandidate} />
      </div>
    </div>
  );
};

export default SuggestionCandidate;
