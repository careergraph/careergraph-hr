import { Candidate } from "@/types/candidate";
import { Dispatch, SetStateAction } from "react";

interface CandidateHorizontalListProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  setSelectedCandidate: Dispatch<SetStateAction<Candidate | null>>;
}

const tagColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-yellow-100 text-yellow-700",
  "bg-pink-100 text-pink-700",
  "bg-purple-100 text-purple-700",
  "bg-indigo-100 text-indigo-700",
];

const CandidateHorizontalList = ({
  candidates,
  selectedCandidate,
  setSelectedCandidate,
}: CandidateHorizontalListProps) => {
  return (
    <div className="mb-6">
      <div className="flex space-x-4 overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-gray-300 scroll-m-1">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className={`flex-shrink-0 w-64 max-h-40 p-3 border rounded-xl shadow-sm cursor-pointer ${
              selectedCandidate?.id === candidate.id
                ? "border-blue-500 ring-1 ring-blue-300"
                : "border-gray-200"
            }`}
            onClick={() => setSelectedCandidate(candidate)}
          >
            <div className="flex items-center gap-3 mb-2">
              {/* Avatar */}
              {candidate.avatar ? (
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                  {candidate.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{candidate.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {candidate.position}
                </p>
              </div>
            </div>

            {/* Labels */}
            <div className="flex flex-wrap gap-1 mt-1">
              {candidate.labels?.slice(0, 4).map((label, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    tagColors[idx % tagColors.length]
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidateHorizontalList;
