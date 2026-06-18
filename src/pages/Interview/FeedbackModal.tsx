import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "@/components/custom/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInterviewStore } from "@/stores/interviewStore";
import { toast } from "sonner";
import { Check, ChevronDown, ClipboardCheck } from "lucide-react";
import { companyPipelineService } from "@/services/companyPipelineService";
import type { CompanyRecruitmentStage } from "@/lib/recruitmentPipeline";
import type { FeedbackRecommendation } from "@/types/interview";
import { buildFeedbackRecommendationOptions } from "./feedbackRecommendationOptions";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  interviewId: string;
  initialInterviewId?: string;
  candidateName?: string;
  candidateOptions?: Array<{
    interviewId: string;
    candidateName: string;
  }>;
  onSubmitted?: (targetInterviewId: string) => void | Promise<void>;
}

const RATINGS = [1, 2, 3, 4, 5];
const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function FeedbackModal({
  open,
  onClose,
  interviewId,
  initialInterviewId,
  candidateName,
  candidateOptions,
  onSubmitted,
}: FeedbackModalProps) {
  const { addFeedback, isLoading } = useInterviewStore();
  const [eligibleCandidateOptions, setEligibleCandidateOptions] = useState(candidateOptions ?? []);

  const hasCandidateSelector = eligibleCandidateOptions.length > 0;
  const [selectedInterviewId, setSelectedInterviewId] = useState(() => {
    if (candidateOptions && candidateOptions.length > 0) {
      return candidateOptions[0].interviewId;
    }
    return interviewId;
  });

  const [overallRating, setOverallRating] = useState(3);
  const [technicalScore, setTechnicalScore] = useState<number | undefined>();
  const [communicationScore, setCommunicationScore] = useState<number | undefined>();
  const [cultureFitScore, setCultureFitScore] = useState<number | undefined>();
  const [problemSolvingScore, setProblemSolvingScore] = useState<number | undefined>();
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [recommendation, setRecommendation] = useState<FeedbackRecommendation>("NEXT_ROUND");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [pipelineStages, setPipelineStages] = useState<CompanyRecruitmentStage[]>([]);
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setEligibleCandidateOptions(candidateOptions ?? []);
  }, [candidateOptions, open]);

  useEffect(() => {
    if (!open) return;
    setFormError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initialInterviewId && eligibleCandidateOptions.some((opt) => opt.interviewId === initialInterviewId)) {
      setSelectedInterviewId(initialInterviewId);
      return;
    }
    if (eligibleCandidateOptions.length > 0) {
      setSelectedInterviewId(eligibleCandidateOptions[0].interviewId);
      return;
    }
    setSelectedInterviewId(interviewId);
  }, [open, eligibleCandidateOptions, interviewId, initialInterviewId]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    companyPipelineService
      .fetchMyRecruitmentStages()
      .then((stages) => {
        if (!cancelled) setPipelineStages(stages);
      })
      .catch(() => {
        if (!cancelled) setPipelineStages([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedCandidateName = hasCandidateSelector
    ? eligibleCandidateOptions.find((opt) => opt.interviewId === selectedInterviewId)?.candidateName
    : candidateName;

  const targetInterviewId = hasCandidateSelector ? selectedInterviewId : interviewId;

  const canSubmit =
    Boolean(targetInterviewId && targetInterviewId.trim().length > 0) &&
    (!candidateOptions?.length || eligibleCandidateOptions.length > 0);
  const recommendationOptions = useMemo(
    () => buildFeedbackRecommendationOptions(pipelineStages),
    [pipelineStages]
  );
  const selectedRecommendation = recommendationOptions.find((option) => option.value === recommendation);

  const resolveSubmitErrorMessage = (error: unknown): string => {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error
    ) {
      const response = (error as { response?: { data?: { message?: unknown } } }).response;
      if (typeof response?.data?.message === "string" && response.data.message.trim()) {
        return response.data.message;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return "Không thể gửi đánh giá";
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setFormError("Vui lòng chọn ứng viên cần đánh giá.");
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }

    setFormError("");

    try {
      await addFeedback(targetInterviewId, {
        overallRating,
        technicalScore,
        communicationScore,
        cultureFitScore,
        problemSolvingScore,
        strengths: strengths || undefined,
        weaknesses: weaknesses || undefined,
        recommendation,
        notes: notes || undefined,
      });

      if (onSubmitted) {
        await onSubmitted(targetInterviewId);
      }

      toast.success("Đã gửi đánh giá thành công");
      onClose();
    } catch (error: unknown) {
      setFormError(resolveSubmitErrorMessage(error));
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-[550px] p-0">
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-5">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-foreground">
            Đánh giá phỏng vấn
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {formError ? (
            <div ref={errorRef} className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          {hasCandidateSelector ? (
            <div className="space-y-2 mb-4">
              <Label>Chọn ứng viên</Label>
              <CustomSelect
                value={selectedInterviewId}
                onChange={setSelectedInterviewId}
                placeholder="Chọn ứng viên"
                searchable
                searchPlaceholder="Tìm ứng viên..."
                options={
                  eligibleCandidateOptions.map((opt) => ({
                    value: opt.interviewId,
                    label: opt.candidateName,
                  }))
                }
              />
            </div>
          ) : null}

          {selectedCandidateName && (
            <p className="text-sm text-muted-foreground mb-4">
              Ứng viên: <span className="font-medium text-slate-900">{selectedCandidateName}</span>
            </p>
          )}

          <div className="space-y-4">
            {/* Overall Rating */}
            <div className="space-y-2">
              <Label>Đánh giá tổng quan (1-5)</Label>
              <div className="flex gap-2">
                {RATINGS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setOverallRating(r)}
                    className={`w-10 h-10 rounded-full border-2 text-sm font-semibold transition-colors ${
                      overallRating >= r
                        ? "border-yellow-400 bg-yellow-400 text-white"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Score selectors */}
            <div className="grid grid-cols-2 gap-4">
              <ScoreSelect label="Kỹ thuật" value={technicalScore} onChange={setTechnicalScore} scores={SCORES} />
              <ScoreSelect label="Giao tiếp" value={communicationScore} onChange={setCommunicationScore} scores={SCORES} />
              <ScoreSelect label="Văn hóa" value={cultureFitScore} onChange={setCultureFitScore} scores={SCORES} />
              <ScoreSelect label="Giải quyết vấn đề" value={problemSolvingScore} onChange={setProblemSolvingScore} scores={SCORES} />
            </div>

            <div className="space-y-2">
              <Label>Điểm mạnh</Label>
              <Textarea
                placeholder="Điểm mạnh của ứng viên..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                rows={2}
                className="border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label>Điểm yếu</Label>
              <Textarea
                placeholder="Điểm cần cải thiện..."
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                rows={2}
                className="border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label>Đề xuất</Label>
              <CustomSelect
                value={recommendation}
                onChange={(value) => setRecommendation(value as FeedbackRecommendation)}
                searchable
                searchPlaceholder="Tìm đề xuất..."
                options={recommendationOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <p className="text-xs text-muted-foreground">
                {selectedRecommendation?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú thêm</Label>
              <Textarea
                placeholder="Ghi chú..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border/60 px-6 py-5">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !canSubmit}>
            {isLoading ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ScoreSelect({
  label,
  value,
  onChange,
  scores,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  scores: number[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label} (1-10)</Label>
      <CustomSelect
        value={value != null ? String(value) : ""}
        onChange={(v) => onChange(v ? Number(v) : undefined)}
        placeholder="--"
        searchable
        searchPlaceholder={`Tìm điểm ${label.toLowerCase()}...`}
        noResultsText="Không tìm thấy mức điểm"
        options={scores.map((s) => ({ value: String(s), label: String(s) }))}
      />
    </div>
  );
}

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn",
  searchable = false,
  searchPlaceholder = "Tìm kiếm...",
  noResultsText = "Không có kết quả",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
    openUpward: boolean;
  } | null>(null);

  const computeMenuStyle = () => {
    if (!triggerRef.current) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const estimatedMenuHeight = 250;
    const openUpward = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;

    return {
      top: openUpward ? rect.top : rect.bottom,
      left: rect.left,
      width: rect.width,
      openUpward,
    };
  };

  const selectedLabel = useMemo(() => {
    return options.find((item) => item.value === value)?.label ?? "";
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => option.label.toLowerCase().includes(keyword));
  }, [options, searchable, searchText]);

  useEffect(() => {
    if (!open) return;

    const updateMenuPosition = () => {
      const nextStyle = computeMenuStyle();
      if (nextStyle) setMenuStyle(nextStyle);
    };

    updateMenuPosition();

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = rootRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    };

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !menuStyle || !menuRef.current) return;

    const menuEl = menuRef.current;
    menuEl.style.left = `${menuStyle.left}px`;
    menuEl.style.width = `${menuStyle.width}px`;

    if (menuStyle.openUpward) {
      menuEl.style.top = `${menuStyle.top - 4}px`;
      menuEl.style.transform = "translateY(-100%)";
    } else {
      menuEl.style.top = `${menuStyle.top + 4}px`;
      menuEl.style.transform = "none";
    }
  }, [open, menuStyle]);

  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      setSearchText("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !searchable) return;

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, searchable]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }

          const nextStyle = computeMenuStyle();
          if (nextStyle) setMenuStyle(nextStyle);
          setOpen(true);
        }}
      >
        <span className={selectedLabel ? "text-slate-900" : "text-slate-400"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100001] max-h-56 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-xl"
        >
          {searchable && (
            <div className="sticky top-0 z-[1] border-b border-slate-200 bg-white px-2 py-2">
              <input
                ref={searchInputRef}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              />
            </div>
          )}

          {filteredOptions.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                  selected
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {selected ? <Check className="h-4 w-4" /> : null}
              </button>
            );
          })}

          {filteredOptions.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-400">{noResultsText}</p>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
