import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import { Job } from "@/types/job";

interface PromoteStepProps {
  jobData: Partial<Job>;
  onUpdate: (data: Partial<Job>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const PromoteStep = ({
  jobData,
  onUpdate,
  onSubmit,
  onBack,
}: PromoteStepProps) => {
  const [promotionType, setPromotionType] = useState<"free" | "paid">(
    jobData.promotionType || "free"
  );

  const handlePromote = () => {
    onUpdate({
      ...jobData,
      promotionType,
      status: "active",
    });
    onSubmit();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Promote</h2>
        <p className="text-muted-foreground">
          Choosing the recommended budget means your listing will get better
          visibility and show up more often in search results, making it easier
          for relevant job seekers to find and apply to your job.
        </p>
      </div>

      <div>
        <Label className="text-base font-semibold">
          Job Type<span className="text-destructive">*</span>
        </Label>
        <Select
          value={promotionType}
          onValueChange={(value) => setPromotionType(value as "free" | "paid")}
        >
          <SelectTrigger className="mt-2 h-14">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-900 z-50">
            <SelectItem value="free">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Public</span>
                <span className="text-muted-foreground">(Free)</span>
              </div>
            </SelectItem>
            <SelectItem value="paid">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Premium</span>
                <span className="text-muted-foreground">(Paid)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {promotionType === "free" && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-success" />
            <span>Shown in search results</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Additional Promotions</h3>
        <div className="bg-muted rounded-lg p-8 flex items-center justify-center text-muted-foreground">
          Not Available
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button
          onClick={onBack}
          variant="ghost"
          size="lg"
          className="px-8 text-primary"
        >
          <span className="mr-2">←</span> Edit Job
        </Button>
        <Button onClick={handlePromote} size="lg" className="px-8">
          Promote
        </Button>
      </div>
    </div>
  );
};
