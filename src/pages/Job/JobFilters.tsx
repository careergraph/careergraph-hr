import { ChangeEvent, memo, useCallback } from "react";
import { Loader2, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router";
import { EmploymentType, JobCategory } from "@/enums/workEnum";
import { Status } from "@/enums/commonEnum";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

/* eslint-disable react-refresh/only-export-components */
export type JobFilterState = {
  categories: JobCategory[];
  statuses: Status[];
  employmentTypes: EmploymentType[];
};

export const initialJobFilterState: JobFilterState = {
  categories: [],
  statuses: [],
  employmentTypes: [],
};

type JobFiltersProps = {
  value: JobFilterState;
  onChange: (value: JobFilterState) => void;
  onReset?: () => void;
  totalResults?: number;
  isLoading?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

const statusLabels: Record<Status, string> = {
  [Status.ACTIVE]: "Đang tuyển",
  [Status.INACTIVE]: "Tạm dừng",
  [Status.DRAFT]: "Bản nháp",
  [Status.CLOSED]: "Đã đóng",
};

const employmentTypeLabels: Record<EmploymentType, string> = {
  [EmploymentType.FULL_TIME]: "Toàn thời gian",
  [EmploymentType.PART_TIME]: "Bán thời gian",
  [EmploymentType.CONTRACT]: "Hợp đồng",
  [EmploymentType.INTERNSHIP]: "Thực tập",
  [EmploymentType.FREELANCE]: "Tự do",
  [EmploymentType.TEMPORARY]: "Thời vụ",
};

const jobCategoryLabels: Record<JobCategory, string> = {
  [JobCategory.ENGINEER]: "Kỹ thuật",
  [JobCategory.BUSINESS]: "Kinh doanh",
  [JobCategory.ART_MUSIC]: "Nghệ thuật & Âm nhạc",
  [JobCategory.ADMINISTRATION]: "Hành chính",
  [JobCategory.SALES]: "Bán hàng",
  [JobCategory.EDUCATION]: "Giáo dục",
  [JobCategory.CUSTOMER_SERVICE]: "Chăm sóc khách hàng",
  [JobCategory.MANUFACTURING]: "Sản xuất",
};

const toggleValue = <T extends string>(
  values: T[],
  value: T,
  enabled: boolean
) => {
  if (enabled) {
    if (values.includes(value)) return values;
    return [...values, value];
  }

  return values.filter((item) => item !== value);
};

type FilterConfig = {
  key: string;
  title: string;
  options: string[];
  labels: Record<string, string>;
  selected: string[];
  onToggle: (value: string, checked: boolean) => void;
};

const JobFiltersComponent = ({
  value,
  onChange,
  onReset,
  totalResults,
  isLoading,
  searchTerm,
  onSearchChange,
}: JobFiltersProps) => {
  const navigate = useNavigate();
  const handleAddJob = useCallback(() => {
    navigate("/jobs/new");
  }, [navigate]);

  const appliedCount =
    value.categories.length +
    value.statuses.length +
    value.employmentTypes.length;

  const hasActiveFilters = appliedCount > 0 || Boolean(searchTerm.trim());

  const handleStatusChange = (status: Status, checked: boolean) => {
    onChange({
      ...value,
      statuses: toggleValue(value.statuses, status, checked),
    });
  };

  const handleEmploymentTypeChange = (
    type: EmploymentType,
    checked: boolean
  ) => {
    onChange({
      ...value,
      employmentTypes: toggleValue(value.employmentTypes, type, checked),
    });
  };

  const handleCategoryChange = (category: JobCategory, checked: boolean) => {
    onChange({
      ...value,
      categories: toggleValue(value.categories, category, checked),
    });
  };

  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleClearAll = () => {
    onSearchChange("");
    onReset?.();
  };

  const handleClearSearch = () => {
    onSearchChange("");
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: "statuses",
      title: "Trạng thái",
      options: Object.values(Status) as string[],
      labels: statusLabels as Record<string, string>,
      selected: value.statuses as string[],
      onToggle: (nextValue, checked) =>
        handleStatusChange(nextValue as Status, checked),
    },
    {
      key: "employmentTypes",
      title: "Hình thức làm việc",
      options: Object.values(EmploymentType) as string[],
      labels: employmentTypeLabels as Record<string, string>,
      selected: value.employmentTypes as string[],
      onToggle: (nextValue, checked) =>
        handleEmploymentTypeChange(nextValue as EmploymentType, checked),
    },
    {
      key: "categories",
      title: "Nhóm công việc",
      options: Object.values(JobCategory) as string[],
      labels: jobCategoryLabels as Record<string, string>,
      selected: value.categories as string[],
      onToggle: (nextValue, checked) =>
        handleCategoryChange(nextValue as JobCategory, checked),
    },
  ];

  const filterBadges = [
    ...value.statuses.map((status) => ({
      id: `status-${status}`,
      label: statusLabels[status],
      onRemove: () => handleStatusChange(status, false),
    })),
    ...value.employmentTypes.map((type) => ({
      id: `employment-${type}`,
      label: employmentTypeLabels[type],
      onRemove: () => handleEmploymentTypeChange(type, false),
    })),
    ...value.categories.map((category) => ({
      id: `category-${category}`,
      label: jobCategoryLabels[category],
      onRemove: () => handleCategoryChange(category, false),
    })),
  ];

  return (
    <section className="rounded-3xl border border-border/60 bg-card/80 px-5 py-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={handleSearchInputChange}
            placeholder="Tìm kiếm theo chức danh, kỹ năng hoặc từ khóa..."
            className="h-12 rounded-full border-border/60 bg-background/80 pl-10 pr-12 shadow-sm transition focus-visible:ring-primary/30"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted/40"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="inline-flex h-12 items-center gap-2 rounded-full border-border/60 bg-background/80 px-5 text-sm font-medium shadow-sm transition hover:border-primary/40 hover:text-primary data-[state=open]:bg-card"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Bộ lọc nâng cao
                {appliedCount > 0 && (
                  <span className="ml-1 flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-primary/15 px-2 text-xs font-semibold text-primary">
                    {appliedCount}
                  </span>
                )}
                {isLoading && (
                  <Loader2 className="ml-1 h-4 w-4 animate-spin text-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[min(420px,90vw)] border border-border/60 bg-card/95 p-0 shadow-2xl backdrop-blur"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Bộ lọc nâng cao
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleClearAll}
                  >
                    <X className="h-3 w-3" />
                    Xóa tất cả
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-[60vh]">
                <div className="px-4 py-4">
                  <Accordion
                    type="multiple"
                    defaultValue={filterConfigs.map((config) => config.key)}
                    className="space-y-3 bg-white dark:bg-slate-900 z-50 max-h-[250px] overflow-y-auto"
                  >
                    {filterConfigs.map((config) => {
                      const {
                        key,
                        title,
                        options,
                        labels,
                        selected,
                        onToggle,
                      } = config;

                      return (
                        <AccordionItem
                          key={key}
                          value={key}
                          className="overflow-hidden rounded-2xl border border-border/60 bg-background/80 px-2 shadow-sm dark:bg-slate-900/60"
                        >
                          <AccordionTrigger className="px-2 text-left text-sm font-semibold">
                            <div className="flex w-full items-center justify-between bg-w">
                              <span>{title}</span>
                              <span className="text-xs font-medium text-muted-foreground">
                                {selected.length > 0
                                  ? `${selected.length} đã chọn`
                                  : "Tất cả"}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-1 pb-4 pt-0">
                            <div className="space-y-2">
                              {options.map((option) => (
                                <label
                                  key={option}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-background/70 px-3 py-2 text-sm transition hover:bg-muted/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={selected.includes(option)}
                                      onCheckedChange={(checked) =>
                                        onToggle(option, Boolean(checked))
                                      }
                                    />
                                    <span className="text-sm text-foreground">
                                      {labels[option] ?? option}
                                    </span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={handleAddJob}
          >
            <Plus className="h-4 w-4" />
            Thêm công việc
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium text-muted-foreground">
          {totalResults !== undefined
            ? `${totalResults} công việc`
            : "Tùy chỉnh bộ lọc để khám phá thêm cơ hội"}
        </div>
        {hasActiveFilters && (
          <>
            {searchTerm && (
              <Badge
                variant="outline"
                className="flex items-center gap-2 rounded-full border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                {searchTerm}
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-full p-1 transition hover:bg-primary/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filterBadges.map((badge) => (
              <Badge
                key={badge.id}
                variant="outline"
                className="flex items-center gap-2 rounded-full border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                {badge.label}
                <button
                  type="button"
                  onClick={badge.onRemove}
                  className="rounded-full p-1 transition hover:bg-primary/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleClearAll}
            >
              <X className="h-3 w-3" />
              Xóa tất cả
            </Button>
          </>
        )}
      </div>
    </section>
  );
};

const JobFilters = memo(JobFiltersComponent);

export default JobFilters;
/* eslint-enable react-refresh/only-export-components */
