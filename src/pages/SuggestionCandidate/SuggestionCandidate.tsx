import { useState } from "react";
import { CandidateDetail } from "@/pages/SuggestionCandidate/CandidateDetail";
import { Candidate } from "@/types/candidate";
import { initialCandidates } from "@/data/candidateData";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CandidateHorizontalList from "@/pages/SuggestionCandidate/CandidateHorizontalList";
import SearchCandidate from "./SearchCandidate";

// SuggestionCandidate hiển thị danh sách gợi ý và chi tiết ứng viên.

const SuggestionCandidate = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );

  // Search và filter candidate
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchQuery, setSearchQuery] = useState("");
  // Lọc ứng viên theo tên hoặc vị trí dựa trên từ khóa.
  const filteredCandidates = initialCandidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background px-6 py-6">
      {/* Thiết lập metadata và breadcrumb cho trang gợi ý ứng viên. */}
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Tìm ứng viên" />

      {/* Khu vực tìm kiếm ứng viên. */}
      <SearchCandidate />

      {/* Danh sách ứng viên gợi ý phía trên. */}
      <CandidateHorizontalList
        candidates={filteredCandidates}
        selectedCandidate={selectedCandidate}
        setSelectedCandidate={setSelectedCandidate}
      />

      {/* Khu vực hiển thị chi tiết ứng viên đã chọn. */}
      <div className="w-full">
        <CandidateDetail candidate={selectedCandidate} />
      </div>
    </div>
  );
};

export default SuggestionCandidate;
