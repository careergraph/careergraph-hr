import { useState } from "react";
import { StepIndicator } from "../AddJobSteps/StepIndicator";
import { JobDetailsStep } from "../AddJobSteps/JobDetailsStep";
import { ApplicationRequirementsStep } from "../AddJobSteps/ApplicationRequirementsStep";
import { PromoteStep } from "../AddJobSteps/PromoteStep";
import { Job } from "@/types/job";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const AddJob = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [jobData, setJobData] = useState<Partial<Job>>({
    status: "draft",
  });

  const steps = ["Information", "Requirements", "Promote"];

  const handleJobDataUpdate = (data: Partial<Job>) => {
    setJobData(data);
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    console.log("Job submitted:", jobData);
    toast.success("Job posted successfully!");
    navigate("/jobs");
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <StepIndicator currentStep={currentStep} steps={steps} />

        <div className="bg-card rounded-lg shadow-sm border p-8">
          {currentStep === 1 && (
            <JobDetailsStep
              jobData={jobData}
              onUpdate={handleJobDataUpdate}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <ApplicationRequirementsStep
              jobData={jobData}
              onUpdate={handleJobDataUpdate}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <PromoteStep
              jobData={jobData}
              onUpdate={handleJobDataUpdate}
              onSubmit={handleSubmit}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddJob;
