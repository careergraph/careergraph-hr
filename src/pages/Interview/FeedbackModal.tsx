import { useState } from "react";
import { Modal } from "@/components/custom/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInterviewStore } from "@/stores/interviewStore";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  interviewId: string;
  candidateName?: string;
}

const RATINGS = [1, 2, 3, 4, 5];
const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function FeedbackModal({
  open,
  onClose,
  interviewId,
  candidateName,
}: FeedbackModalProps) {
  const { addFeedback, isLoading } = useInterviewStore();

  const [overallRating, setOverallRating] = useState(3);
  const [technicalScore, setTechnicalScore] = useState<number | undefined>();
  const [communicationScore, setCommunicationScore] = useState<number | undefined>();
  const [cultureFitScore, setCultureFitScore] = useState<number | undefined>();
  const [problemSolvingScore, setProblemSolvingScore] = useState<number | undefined>();
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [recommendation, setRecommendation] = useState("NEXT_ROUND");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    try {
      await addFeedback(interviewId, {
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
      toast.success("Đã gửi đánh giá thành công");
      onClose();
    } catch {
      toast.error("Không thể gửi đánh giá");
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-[550px] p-0">
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-5">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-foreground">
            Đánh giá phỏng vấn
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {candidateName && (
            <p className="text-sm text-muted-foreground mb-4">
              Ứng viên: <span className="font-medium text-slate-900">{candidateName}</span>
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
              <Select value={recommendation} onValueChange={setRecommendation}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-slate-200 bg-white text-slate-900">
                  <SelectItem value="NEXT_ROUND">Vòng tiếp theo</SelectItem>
                  <SelectItem value="EXTEND_OFFER">Gửi offer</SelectItem>
                  <SelectItem value="REJECT">Từ chối</SelectItem>
                  <SelectItem value="HOLD">Chờ xem xét</SelectItem>
                </SelectContent>
              </Select>
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
          <Button onClick={handleSubmit} disabled={isLoading}>
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
      <Select
        value={value != null ? String(value) : ""}
        onValueChange={(v) => onChange(v ? Number(v) : undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent>
          {scores.map((s) => (
            <SelectItem key={s} value={String(s)}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
