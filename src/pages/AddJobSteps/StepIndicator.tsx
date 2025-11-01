import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// StepIndicator biểu diễn tiến độ các bước tạo job bằng các trạng thái khác nhau.

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export const StepIndicator = ({ currentStep, steps }: StepIndicatorProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8 mt-[-25px]">
      {/* Thanh tiến độ nằm ngang hiển thị bước đã hoàn thành, hiện tại và sắp tới. */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={stepNumber} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center font-medium text-base border-2 transition-all",
                    isCompleted && "bg-gray-200 text-gray-400 border-gray-300",
                    isCurrent && "bg-white text-blue-600 border-blue-500 shadow-sm",
                    !isCompleted && !isCurrent && "bg-gray-100 text-gray-400 border-gray-200"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-gray-400" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 font-normal text-center",
                    isCurrent && "text-blue-700 font-semibold",
                    isCompleted && "text-gray-500",
                    !isCurrent && !isCompleted && "text-gray-400"
                  )}
                >
                  {step}
                </span>
              </div>
              {stepNumber < steps.length && (
                <div
                  className="h-0.5 flex-1 mx-2 bg-gray-200 rounded-full"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
