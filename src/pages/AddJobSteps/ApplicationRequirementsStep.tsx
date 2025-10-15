import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Job, ApplicationRequirements } from "@/types/job";

interface ApplicationRequirementsStepProps {
  jobData: Partial<Job>;
  onUpdate: (data: Partial<Job>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ApplicationRequirementsStep = ({
  jobData,
  onUpdate,
  onNext,
  onBack,
}: ApplicationRequirementsStepProps) => {
  const [touched, setTouched] = useState(false);
  const [requirements, setRequirements] = useState<ApplicationRequirements>(
    jobData.applicationRequirements || {
      resume: true,
      coverLetter: true,
      photo: true,
      desiredSalary: false,
      screeningQuestions: [],
    }
  );

  const handleRequirementChange = (
    field: keyof ApplicationRequirements,
    value: boolean
  ) => {
    setRequirements({
      ...requirements,
      [field]: value,
    });
  };

  const isStepValid = requirements.resume && requirements.coverLetter;
  const handleNext = () => {
    setTouched(true);
    if (!isStepValid) return;
    onUpdate({
      ...jobData,
      applicationRequirements: requirements,
    });
    onNext();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Personal information</h2>
        <p className="text-muted-foreground">
          Decide what should be displayed on the application form.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between py-4 border-b">
          <Label
            htmlFor="resume"
            className="text-base font-normal cursor-pointer"
          >
            Resume
          </Label>
          <Checkbox
            id="resume"
            checked={requirements.resume}
            onCheckedChange={(checked) =>
              handleRequirementChange("resume", checked as boolean)
            }
            className="h-6 w-6"
          />
        </div>

        <div className="flex items-center justify-between py-4 border-b">
          <Label
            htmlFor="coverLetter"
            className="text-base font-normal cursor-pointer"
          >
            Cover Letter
          </Label>
          <Checkbox
            id="coverLetter"
            checked={requirements.coverLetter}
            onCheckedChange={(checked) =>
              handleRequirementChange("coverLetter", checked as boolean)
            }
            className="h-6 w-6"
          />
        </div>

        <div className="flex items-center justify-between py-4 border-b">
          <Label
            htmlFor="photo"
            className="text-base font-normal cursor-pointer"
          >
            Photo
          </Label>
          <Checkbox
            id="photo"
            checked={requirements.photo}
            onCheckedChange={(checked) =>
              handleRequirementChange("photo", checked as boolean)
            }
            className="h-6 w-6"
          />
        </div>

        <div className="flex items-center justify-between py-4 border-b">
          <Label
            htmlFor="desiredSalary"
            className="text-base font-normal cursor-pointer"
          >
            Desired Salary
          </Label>
          <Checkbox
            id="desiredSalary"
            checked={requirements.desiredSalary}
            onCheckedChange={(checked) =>
              handleRequirementChange("desiredSalary", checked as boolean)
            }
            className="h-6 w-6"
          />
        </div>
      </div>

      <div className="pt-8">
        <h3 className="text-xl font-bold mb-2">
          Ask candidates about their qualifications
        </h3>
        <p className="text-muted-foreground mb-6">
          Add screening questions below to find the best candidates more easily
        </p>
      </div>

      <div className="flex justify-between pt-6">
        <Button onClick={onBack} variant="outline" size="lg" className="px-8">
          Back
        </Button>
        <Button onClick={handleNext} size="lg" className="px-8" disabled={!isStepValid}>
          Next
        </Button>
        {!isStepValid && touched && (
          <p className="text-xs text-red-500 mt-2 text-right w-full">Resume và Cover Letter là bắt buộc.</p>
        )}
      </div>
    </div>
  );
};
