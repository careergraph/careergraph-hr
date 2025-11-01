import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RichTextarea } from "@/components/ui/rich-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Wand2 } from "lucide-react";
import { Job } from "@/types/job";
import { type Touched, type ErrorType } from "@/types/job";
import useLocation from "@/hooks/use-location";
import { District, Province, Ward } from "@/types/location";
import { SkillLookup } from "@/types/skill";
import { lookup } from "@/api/skillApis";
import {
  EmploymentType,
  Education,
  ExperienceLevel,
  JobCategory,
} from "@/enums/workEnum";
import { Sparkles } from "lucide-react";

// JobDetailsStep thu thập thông tin cốt lõi, vị trí và kỹ năng cho job trong wizard tạo mới.

interface JobDetailsStepProps {
  jobData: Partial<Job>;
  onUpdate: (data: Partial<Job>) => void;
  onNext: (data: Partial<Job>) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const JobDetailsStep = ({
  jobData,
  onUpdate,
  onNext,
  isSubmitting = false,
}: JobDetailsStepProps) => {
  // State cho location
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<
    string | undefined
  >(undefined);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<
    string | undefined
  >(undefined);
  const [selectedWardCode, setSelectedWardCode] = useState<string | undefined>(
    undefined
  );

  // Gọi hook lấy location
  const {
    provinces,
    districts,
    wards,
    loadingProvinces,
    loadingDistricts,
    loadingWards,
  } = useLocation(selectedProvinceCode, selectedDistrictCode);

  // State cho skill
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState<SkillLookup[]>([]);
  const [skillLoading, setSkillLoading] = useState(false);

  // Gọi API tìm kỹ năng mỗi khi người dùng thay đổi từ khóa.
  useEffect(() => {
    // Khi input trống thì reset danh sách, tránh gọi API không cần thiết.
    if (!query || query.trim().length === 0) {
      setSkills([]);
      return;
    }

    setSkillLoading(true);

    // Debounce 400ms để chỉ gọi API khi người dùng ngừng nhập.
    const delayData = setTimeout(async () => {
      const response = await lookup(query);
      setSkills(response.data || []);
      setSkillLoading(false);
    }, 400);

    // Huỷ debounce nếu query đổi trước khi timer hoàn thành.
    return () => clearTimeout(delayData);
  }, [query]);

  // State lúc lỗi và chạm input
  const [touched, setTouched] = useState<Touched>({});
  const [error, setError] = useState<ErrorType>({});

  // State cho các danh sách yêu cầu component: Qualifications, Minimum Qualifications, Responsibilities
  const [qualifications, setQualifications] = useState<string[]>(
    jobData.qualifications || []
  );
  const [minQualifications, setMinQualifications] = useState<string[]>(
    jobData.minimumQualifications || []
  );
  const [responsibilities, setResponsibilities] = useState<string[]>(
    jobData.responsibilities || []
  );

  useEffect(() => {
    // Khi đã có danh sách tỉnh, tự động chọn tỉnh khớp dữ liệu job cũ.
    if (!selectedProvinceCode && jobData.state && provinces.length) {
      const matchedProvince = provinces.find(
        (province) => province.name === jobData.state
      );
      if (matchedProvince) {
        setSelectedProvinceCode(String(matchedProvince.code));
      }
    }
  }, [jobData.state, provinces, selectedProvinceCode]);

  useEffect(() => {
    // Tương tự với quận/huyện khi dữ liệu job có city đã lưu.
    if (!selectedDistrictCode && jobData.city && districts.length) {
      const matchedDistrict = districts.find(
        (district) => district.name === jobData.city
      );
      if (matchedDistrict) {
        setSelectedDistrictCode(String(matchedDistrict.code));
      }
    }
  }, [jobData.city, districts, selectedDistrictCode]);

  useEffect(() => {
    // Đồng bộ phường/xã dựa trên dữ liệu job cũ.
    if (!selectedWardCode && jobData.district && wards.length) {
      const matchedWard = wards.find((ward) => ward.name === jobData.district);
      if (matchedWard) {
        setSelectedWardCode(String(matchedWard.code));
      }
    }
  }, [jobData.district, selectedWardCode, wards]);

  // Xử lý các component: Qualifications, Minimum Qualifications, Responsibilities
  const addItem = (
    type: "qualifications" | "minQualifications" | "responsibilities"
  ) => {
    if (type === "qualifications") setQualifications([...qualifications, ""]);
    else if (type === "minQualifications")
      setMinQualifications([...minQualifications, ""]);
    else setResponsibilities([...responsibilities, ""]);
  };

  const removeItem = (
    type: "qualifications" | "minQualifications" | "responsibilities",
    index: number
  ) => {
    // Xóa phần tử theo index trên danh sách tương ứng.
    if (type === "qualifications")
      setQualifications(qualifications.filter((_, i) => i !== index));
    else if (type === "minQualifications")
      setMinQualifications(minQualifications.filter((_, i) => i !== index));
    else setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const updateItem = (
    type: "qualifications" | "minQualifications" | "responsibilities",
    index: number,
    value: string
  ) => {
    // Sao chép mảng để đảm bảo tính bất biến trước khi cập nhật phần tử.
    if (type === "qualifications") {
      const updated = [...qualifications];
      updated[index] = value;
      setQualifications(updated);
    } else if (type === "minQualifications") {
      const updated = [...minQualifications];
      updated[index] = value;
      setMinQualifications(updated);
    } else {
      const updated = [...responsibilities];
      updated[index] = value;
      setResponsibilities(updated);
    }
  };

  // Validate form tạo job
  const validate = (): ErrorType => {
    const err: ErrorType = {};
    // Các trường bắt buộc cần có giá trị; thiết lập thông báo lỗi tương ứng.
    if (!jobData.title || jobData.title.trim() === "") err.title = "Required";
    if (!jobData.description || jobData.description.trim() === "")
      err.description = "Required";
    if (!jobData.minExperience) err.minExperience = "Required";
    if (!jobData.maxExperience) err.maxExperience = "Required";
    if (!jobData.experienceLevel) err.experienceLevel = "Required";
    if (!jobData.employmentType) err.employmentType = "Required";
    if (!jobData.jobCategory) err.jobCategory = "Required";
    if (!jobData.state || !jobData.city || !jobData.district)
      err.location = "Required";

    if (jobData.minExperience && jobData.maxExperience) {
      const min = Number(jobData.minExperience);
      const max = Number(jobData.maxExperience);
      if (Number.isNaN(min) || Number.isNaN(max) || min > max) {
        err.maxExperience = "Invalid range";
      }
    }
    return err;
  };

  // Xử lý khi nhấn Next
  const handleNext = async () => {
    // Chạy validate trước khi chuyển bước kế tiếp.
    const err = validate();
    setTouched({
      title: true,
      description: true,
      minExperience: true,
      maxExperience: true,
      experienceLevel: true,
      jobCategory: true,
      type: true,
      country: true,
    });
    setError(err);
    if (Object.keys(err).length === 0) {
      const payload = {
        ...jobData,
        qualifications,
        minimumQualifications: minQualifications,
        responsibilities,
      };
      onUpdate(payload);
      try {
        // Đẩy dữ liệu lên parent; parent sẽ gọi API lưu nháp.
        await onNext(payload);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Phần này chứa toàn bộ trường thông tin cơ bản, gợi ý AI và yêu cầu chi tiết. */}
      {/* Job Title */}
      <div>
        <Label
          htmlFor="title"
          className={cn(
            "text-sm font-semibold flex items-center gap-1 mb-2",
            touched.title && error.title && "text-red-600"
          )}
        >
          Job Title<span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Job Title"
          value={jobData.title || ""}
          onChange={(e) => {
            onUpdate({ ...jobData, title: e.target.value });
            setTouched((t) => ({ ...t, title: true }));
          }}
          maxLength={100}
        />
      </div>

      {/* AI Generate Expand */}
      <div className="w-full bg-gradient-to-r from-[#4f46e5]/10 via-[#7c3aed]/10 to-[#ec4899]/10 p-4 rounded-2xl border border-violet-300/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-[7]">
            <Sparkles className="size-5 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">
              AI tự động tạo mô tả công việc
            </span>
          </div>
          <button className="flex-[3] group relative inline-flex justify-center items-center gap-2 rounded-full px-4 py-2 font-medium text-white bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] hover:opacity-90 shadow-lg hover:shadow-xl transition-all">
            <Wand2 className="size-4 group-hover:rotate-12 transition-transform" />
            Generate mô tả
          </button>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label
          htmlFor="description"
          className={cn(
            "text-sm font-semibold flex items-center gap-1",
            touched.description && error.description && "text-red-600"
          )}
        >
          Description<span className="text-destructive">*</span>
        </Label>
        <div className="mt-2 border rounded-md">
          <RichTextarea
            id="description"
            placeholder="Enter job description..."
            value={jobData.description || ""}
            onChange={(value) => {
              onUpdate({ ...jobData, description: value });
              setTouched((t) => ({ ...t, description: true }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, description: true }))}
            touched={touched.description}
            // error={error.description}
            className="min-h-32"
          />
        </div>
      </div>

      {/* Qualifications */}
      <div>
        <Label className="text-sm font-semibold">Qualifications</Label>
        <div className="mt-2 space-y-2">
          {qualifications.map((qual, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Add an item"
                value={qual}
                onChange={(e) =>
                  updateItem("qualifications", index, e.target.value)
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem("qualifications", index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => addItem("qualifications")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add an item
          </Button>
        </div>
      </div>

      {/* Minimum Qualifications */}
      <div>
        <Label className="text-sm font-semibold">Minimum Qualifications</Label>
        <div className="mt-2 space-y-2">
          {minQualifications.map((qual, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Add an item"
                value={qual}
                onChange={(e) =>
                  updateItem("minQualifications", index, e.target.value)
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem("minQualifications", index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => addItem("minQualifications")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add an item
          </Button>
        </div>
      </div>

      {/* Responsibilities */}
      <div>
        <Label className="text-sm font-semibold">Responsibilities</Label>
        <div className="mt-2 space-y-2">
          {responsibilities.map((resp, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Add an item"
                value={resp}
                onChange={(e) =>
                  updateItem("responsibilities", index, e.target.value)
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem("responsibilities", index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => addItem("responsibilities")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add an item
          </Button>
        </div>
      </div>

      {/* Experience */}
      <div>
        <Label
          className={cn(
            "text-sm font-semibold flex items-center gap-1",
            (touched.minExperience && error.minExperience) ||
              (touched.maxExperience && error.maxExperience) ||
              (touched.experienceLevel && error.experienceLevel)
              ? "text-red-600"
              : ""
          )}
        >
          Experience (Month)<span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <Input
            placeholder="Min Experience"
            type="number"
            value={jobData.minExperience || ""}
            onChange={(e) => {
              onUpdate({ ...jobData, minExperience: parseInt(e.target.value) });
              setTouched((t) => ({ ...t, minExperience: true }));
            }}
            onFocus={() =>
              setError((prev) => ({ ...prev, minExperience: undefined }))
            }
          />
          <Input
            placeholder="Max Experience"
            type="number"
            value={jobData.maxExperience || ""}
            onChange={(e) => {
              onUpdate({ ...jobData, maxExperience: parseInt(e.target.value) });
              setTouched((t) => ({ ...t, maxExperience: true }));
            }}
          />
          <Select
            value={jobData.experienceLevel || ""}
            onValueChange={(value: ExperienceLevel) => {
              onUpdate({ ...jobData, experienceLevel: value });
              setTouched((t) => ({ ...t, experienceLevel: true }));
              setError((prev) => ({ ...prev, experienceLevel: undefined }));
            }}
          >
            <SelectTrigger className="focus:ring-2 focus:ring-blue-200 focus:border-blue-200 border-gray-300">
              <SelectValue placeholder="Experience Level" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 z-50 max-h-[250px] overflow-y-auto">
              {Object.entries(ExperienceLevel).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Function & Type */}
      <div>
        <Label
          className={cn(
            "text-sm font-semibold flex items-center gap-1",
            (touched.jobCategory && error.jobCategory) ||
              (touched.type && error.type)
              ? "text-red-600"
              : ""
          )}
        >
          Listing Type<span className="text-destructive">*</span>
        </Label>

        <div className="grid grid-cols-3 gap-4 mt-2">
          {/* Job Function */}
          <Select
            value={jobData.jobCategory || ""}
            onValueChange={(value: JobCategory) => {
              onUpdate({ ...jobData, jobCategory: value });
              setTouched((t) => ({ ...t, jobCategory: true }));
            }}
          >
            <SelectTrigger className="focus:ring-2 focus:ring-blue-200 focus:border-blue-200 border-gray-300">
              <SelectValue placeholder="Job Function" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 z-50 max-h-[250px] overflow-y-auto">
              {Object.entries(JobCategory).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Employment Type */}
          <Select
            value={jobData.employmentType || ""}
            onValueChange={(value: EmploymentType) => {
              onUpdate({ ...jobData, employmentType: value });
              setTouched((t) => ({ ...t, employmentType: true }));
            }}
          >
            <SelectTrigger className="focus:ring-2 focus:ring-blue-200 focus:border-blue-200 border-gray-300">
              <SelectValue placeholder="Employment Type" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 z-50 max-h-[250px] overflow-y-auto">
              {Object.entries(EmploymentType).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Education */}
          <Select
            value={jobData.education || ""}
            onValueChange={(value: Education) =>
              onUpdate({ ...jobData, education: value })
            }
          >
            <SelectTrigger className="focus:ring-2 focus:ring-blue-200 focus:border-blue-200 border-gray-300">
              <SelectValue placeholder="Education" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 z-50 max-h-[250px] overflow-y-auto">
              {Object.entries(Education).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location */}
      <div>
        <Label
          className={cn(
            "text-sm font-semibold flex items-center gap-1",
            touched.country && error.location && "text-red-600"
          )}
        >
          Location<span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2 mt-2 mb-4">
          <Checkbox
            id="remote"
            checked={jobData.remoteJob || false}
            onCheckedChange={(checked) =>
              onUpdate({ ...jobData, remoteJob: checked as boolean })
            }
          />
          <Label htmlFor="remote" className="font-normal cursor-pointer">
            Remote Job?
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Provinces */}
          <Select
            value={selectedProvinceCode}
            onValueChange={(value) => {
              const selectedProvince = provinces.find(
                (province) => String(province.code) === value
              );
              onUpdate({
                ...jobData,
                state: selectedProvince?.name || "",
                city: "",
                district: "",
              });
              setTouched((t) => ({ ...t, country: true }));

              setSelectedProvinceCode(value);
              setSelectedDistrictCode(undefined);
              setSelectedWardCode(undefined);
            }}
          >
            <SelectTrigger className="focus:ring-2 focus:ring-blue-200 focus:border-blue-200 border-gray-300">
              <SelectValue
                placeholder={
                  loadingProvinces ? "Loading..." : "Select Province"
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 z-50 max-h-[250px] overflow-y-auto">
              {provinces.map((p: Province) => (
                <SelectItem key={p.code} value={String(p.code)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Districts */}
          <Select
            value={selectedDistrictCode}
            onValueChange={(value) => {
              const selectedDistrict = districts.find(
                (district) => String(district.code) === value
              );
              onUpdate({
                ...jobData,
                city: selectedDistrict?.name || "",
                district: "",
              });

              setSelectedDistrictCode(value);
              setSelectedWardCode(undefined);
            }}
            disabled={!jobData.state || loadingDistricts}
          >
            <SelectTrigger className="focus:ring-2 focus:ring-blue-200 focus:border-blue-200 border-gray-300">
              <SelectValue
                placeholder={
                  loadingDistricts ? "Loading..." : "Select District"
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 z-50 max-h-[250px] overflow-y-auto">
              {districts.map((d: District) => (
                <SelectItem key={d.code} value={String(d.code)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Wards */}
          <Select
            value={selectedWardCode}
            onValueChange={(value) => {
              const selectedWard = wards.find(
                (ward) => String(ward.code) === value
              );
              onUpdate({
                ...jobData,
                district: selectedWard?.name || "",
              });
              setSelectedWardCode(value);
            }}
            disabled={!jobData.city || loadingWards}
          >
            <SelectTrigger className="focus:ring-2 focus:ring-blue-200 focus:border-blue-200 border-gray-300">
              <SelectValue
                placeholder={loadingWards ? "Loading..." : "Select Ward"}
              />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 z-50 max-h-[250px] overflow-y-auto">
              {wards.map((w: Ward) => (
                <SelectItem key={w.code} value={String(w.code)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Specific */}
          <Input
            id="specific"
            placeholder="Địa chỉ cụ thể"
            value={jobData.specific || ""}
            onChange={(e) =>
              onUpdate({
                ...jobData,
                specific: e.target.value,
              })
            }
            onFocus={() => setError((prev) => ({ ...prev, title: undefined }))}
            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
            className="bg-white dark:bg-slate-900 max-h-[250px] overflow-y-auto"
            maxLength={500}
          />
        </div>
      </div>

      {/* Skills */}
      <div>
        <Label className="text-sm font-semibold">Skills</Label>
        <div className="mt-2 relative">
          {/* Hiển thị danh sách kỹ năng đã chọn */}
          <div className="flex flex-wrap gap-2 mb-2">
            {(jobData.skills || []).map((skill) => (
              <span
                key={skill.id}
                className="px-3 py-2 mb-2 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
              >
                {skill.name}
                <button
                  type="button"
                  onClick={() => {
                    const filtered = (jobData.skills || []).filter(
                      (s) => s.id !== skill.id
                    );
                    onUpdate({ ...jobData, skills: filtered });
                  }}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Ô tìm kiếm */}
          <Input
            placeholder="Search skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {skillLoading && (
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
          )}

          {/* Popup dropdown */}
          {!skillLoading && skills.length > 0 && (
            <div className="absolute top-full w-full mt-1 border rounded-md bg-white dark:bg-slate-900 z-50 max-h-[250px] overflow-y-auto">
              {skills.map((s) => (
                <div
                  key={s.id}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => {
                    const updatedSkills = [...(jobData.skills || []), s];
                    onUpdate({ ...jobData, skills: updatedSkills });
                    setQuery("");
                    setSkills([]);
                  }}
                >
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Next button */}
      <div className="flex justify-end">
        <div className="inline-flex items-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium p-1">
          <Button
            onClick={handleNext}
            size="sm"
            className="px-4 py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Tiếp tục"}
          </Button>
        </div>
      </div>
    </div>
  );
};
