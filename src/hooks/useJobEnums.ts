import { useEffect, useMemo, useState } from "react";
import {
  EDUCATION_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  JOB_CATEGORY_OPTIONS,
} from "@/enums/workEnum";
import { jobService } from "@/services/jobService";

type EnumOption = { value: string; label: string };

const toMap = (items: EnumOption[]) =>
  items.reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {});

export const useJobEnums = () => {
  const [experienceLevels, setExperienceLevels] = useState<EnumOption[]>(
    EXPERIENCE_LEVEL_OPTIONS
  );
  const [employmentTypes, setEmploymentTypes] = useState<EnumOption[]>(
    EMPLOYMENT_TYPE_OPTIONS
  );
  const [educationTypes, setEducationTypes] = useState<EnumOption[]>(
    EDUCATION_OPTIONS
  );
  const [jobCategories, setJobCategories] = useState<EnumOption[]>(
    JOB_CATEGORY_OPTIONS
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await jobService.getJobEnums();
        if (!mounted || !data) return;
        if (data.experienceLevels?.length)
          setExperienceLevels(
            data.experienceLevels.map((x) => ({ value: x.code, label: x.name }))
          );
        if (data.employmentTypes?.length)
          setEmploymentTypes(
            data.employmentTypes.map((x) => ({ value: x.code, label: x.name }))
          );
        if (data.educationTypes?.length)
          setEducationTypes(
            data.educationTypes.map((x) => ({ value: x.code, label: x.name }))
          );
        if (data.jobCategories?.length)
          setJobCategories(
            data.jobCategories.map((x) => ({ value: x.code, label: x.name }))
          );
      } catch (error) {
        console.error("Failed to load job enums:", error);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const labelMaps = useMemo(
    () => ({
      experience: toMap(experienceLevels),
      employment: toMap(employmentTypes),
      education: toMap(educationTypes),
      category: toMap(jobCategories),
    }),
    [educationTypes, employmentTypes, experienceLevels, jobCategories]
  );

  return {
    experienceLevels,
    employmentTypes,
    educationTypes,
    jobCategories,
    labelMaps,
  };
};

