enum EmploymentType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERNSHIP = "INTERNSHIP",
  FREELANCE = "FREELANCE",
  TEMPORARY = "TEMPORARY",
}

enum Education {
  HIGH_SCHOOL = "HIGH_SCHOOL",
  ASSOCIATE = "ASSOCIATE",
  BACHELOR = "BACHELOR",
  MASTER = "MASTER",
  DOCTORATE = "DOCTORATE",
  VOCATIONAL = "VOCATIONAL",
  CERTIFICATION = "CERTIFICATION",
  NONE = "NONE",
}

enum ExperienceLevel {
  ENTRY = "ENTRY",
  INTERN = "INTERN",
  MIDDLE = "MIDDLE",
  FRESHER = "FRESHER",
  JUNIOR = "JUNIOR",
  SENIOR = "SENIOR",
  LEADER = "LEADER",
  CTO = "CTO",
  CFO = "CFO",
}

enum JobCategory {
  ENGINEER = "ENGINEER",
  BUSINESS = "BUSINESS",
  ART_MUSIC = "ART_MUSIC",
  ADMINISTRATION = "ADMINISTRATION",
  SALES = "SALES",
  EDUCATION = "EDUCATION",
  CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
  MANUFACTURING = "MANUFACTURING",
  TECHNOLOGY = "TECHNOLOGY",
  MARKETING = "MARKETING",
  FINANCE = "FINANCE",
  HEALTHCARE = "HEALTHCARE",
  HUMAN_RESOURCES = "HUMAN_RESOURCES",
  DESIGN = "DESIGN",
}

type EnumOption<T extends string> = {
  value: T;
  label: string;
};

const EXPERIENCE_LEVEL_OPTIONS: EnumOption<ExperienceLevel>[] = [
  { value: ExperienceLevel.ENTRY, label: "Entry" },
  { value: ExperienceLevel.INTERN, label: "Intern" },
  { value: ExperienceLevel.MIDDLE, label: "Middle" },
  { value: ExperienceLevel.FRESHER, label: "Fresher" },
  { value: ExperienceLevel.JUNIOR, label: "Junior" },
  { value: ExperienceLevel.SENIOR, label: "Senior" },
  { value: ExperienceLevel.LEADER, label: "Leader" },
  { value: ExperienceLevel.CTO, label: "CTO" },
  { value: ExperienceLevel.CFO, label: "CFO" },
];

const EMPLOYMENT_TYPE_OPTIONS: EnumOption<EmploymentType>[] = [
  { value: EmploymentType.FULL_TIME, label: "Full-time" },
  { value: EmploymentType.PART_TIME, label: "Part-time" },
  { value: EmploymentType.CONTRACT, label: "Contract" },
  { value: EmploymentType.INTERNSHIP, label: "Internship" },
  { value: EmploymentType.FREELANCE, label: "Freelance" },
  { value: EmploymentType.TEMPORARY, label: "Temporary" },
];

const EDUCATION_OPTIONS: EnumOption<Education>[] = [
  { value: Education.HIGH_SCHOOL, label: "High School Diploma" },
  { value: Education.ASSOCIATE, label: "Associate Degree" },
  { value: Education.BACHELOR, label: "Bachelor's Degree" },
  { value: Education.MASTER, label: "Master's Degree" },
  { value: Education.DOCTORATE, label: "Doctorate" },
  { value: Education.VOCATIONAL, label: "Vocational Training" },
  { value: Education.CERTIFICATION, label: "Professional Certification" },
  { value: Education.NONE, label: "No Formal Education" },
];

const JOB_CATEGORY_OPTIONS: EnumOption<JobCategory>[] = [
  { value: JobCategory.ENGINEER, label: "Engineer" },
  { value: JobCategory.BUSINESS, label: "Business" },
  { value: JobCategory.ART_MUSIC, label: "Art & Music" },
  { value: JobCategory.ADMINISTRATION, label: "Administration" },
  { value: JobCategory.SALES, label: "Sales" },
  { value: JobCategory.EDUCATION, label: "Education" },
  { value: JobCategory.CUSTOMER_SERVICE, label: "Customer Service" },
  { value: JobCategory.MANUFACTURING, label: "Manufacturing" },
  { value: JobCategory.TECHNOLOGY, label: "Technology" },
  { value: JobCategory.MARKETING, label: "Marketing" },
  { value: JobCategory.FINANCE, label: "Finance" },
  { value: JobCategory.HEALTHCARE, label: "Healthcare" },
  { value: JobCategory.HUMAN_RESOURCES, label: "Human Resources" },
  { value: JobCategory.DESIGN, label: "Design" },
];

export {
  EmploymentType,
  Education,
  ExperienceLevel,
  JobCategory,
  EXPERIENCE_LEVEL_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  EDUCATION_OPTIONS,
  JOB_CATEGORY_OPTIONS,
};
