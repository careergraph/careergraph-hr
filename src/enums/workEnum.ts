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
  { value: ExperienceLevel.ENTRY, label: "Mới vào nghề" },
  { value: ExperienceLevel.INTERN, label: "Thực tập sinh" },
  { value: ExperienceLevel.MIDDLE, label: "Chuyên viên" },
  { value: ExperienceLevel.FRESHER, label: "Mới tốt nghiệp" },
  { value: ExperienceLevel.JUNIOR, label: "Nhân viên Junior" },
  { value: ExperienceLevel.SENIOR, label: "Nhân viên Senior" },
  { value: ExperienceLevel.LEADER, label: "Trưởng nhóm" },
  { value: ExperienceLevel.CTO, label: "CTO" },
  { value: ExperienceLevel.CFO, label: "CFO" },
];

const EMPLOYMENT_TYPE_OPTIONS: EnumOption<EmploymentType>[] = [
  { value: EmploymentType.FULL_TIME, label: "Toàn thời gian" },
  { value: EmploymentType.PART_TIME, label: "Bán thời gian" },
  { value: EmploymentType.CONTRACT, label: "Hợp đồng" },
  { value: EmploymentType.INTERNSHIP, label: "Thực tập" },
  { value: EmploymentType.FREELANCE, label: "Làm tự do" },
  { value: EmploymentType.TEMPORARY, label: "Tạm thời" },
];

const EDUCATION_OPTIONS: EnumOption<Education>[] = [
  { value: Education.HIGH_SCHOOL, label: "Trung học phổ thông" },
  { value: Education.ASSOCIATE, label: "Cao đẳng" },
  { value: Education.BACHELOR, label: "Đại học" },
  { value: Education.MASTER, label: "Thạc sĩ" },
  { value: Education.DOCTORATE, label: "Tiến sĩ" },
  { value: Education.VOCATIONAL, label: "Đào tạo nghề" },
  { value: Education.CERTIFICATION, label: "Chứng chỉ chuyên môn" },
  { value: Education.NONE, label: "Không yêu cầu" },
];

const JOB_CATEGORY_OPTIONS: EnumOption<JobCategory>[] = [
  { value: JobCategory.ENGINEER, label: "Kỹ thuật" },
  { value: JobCategory.BUSINESS, label: "Kinh doanh" },
  { value: JobCategory.ART_MUSIC, label: "Nghệ thuật & Âm nhạc" },
  { value: JobCategory.ADMINISTRATION, label: "Hành chính" },
  { value: JobCategory.SALES, label: "Bán hàng" },
  { value: JobCategory.EDUCATION, label: "Giáo dục" },
  { value: JobCategory.CUSTOMER_SERVICE, label: "Chăm sóc khách hàng" },
  { value: JobCategory.MANUFACTURING, label: "Sản xuất" },
  { value: JobCategory.TECHNOLOGY, label: "Công nghệ" },
  { value: JobCategory.MARKETING, label: "Marketing" },
  { value: JobCategory.FINANCE, label: "Tài chính" },
  { value: JobCategory.HEALTHCARE, label: "Y tế" },
  { value: JobCategory.HUMAN_RESOURCES, label: "Nhân sự" },
  { value: JobCategory.DESIGN, label: "Thiết kế" },
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
