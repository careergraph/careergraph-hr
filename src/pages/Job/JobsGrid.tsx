import { Plus } from "lucide-react";
import { JobCard } from "./JobCard";
import { Job } from "@/types/job";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { useNavigate } from "react-router";

const sampleJobs: Job[] = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    type: "Full-time",
    department: "Engineering",
    location: "Hà Nội, Việt Nam",
    postedDate: "15/03/2024",
    status: "active",
    applicants: 5,
    views: 20,
    saved: 3,
    likes: 4,
    shares: 2,
  },
  {
    id: 2,
    title: "Product Designer",
    type: "Part-time",
    department: "Design",
    location: "Remote",
    postedDate: "10/03/2024",
    status: "draft",
    applicants: 2,
    views: 10,
    saved: 1,
    likes: 2,
    shares: 0,
  },
  {
    id: 3,
    title: "DevOps Engineer",
    type: "Contract",
    department: "Infrastructure",
    location: "Hồ Chí Minh, Việt Nam",
    postedDate: "05/03/2024",
    status: "closed",
    applicants: 0,
    views: 5,
    saved: 0,
    likes: 0,
    shares: 0,
  },
];

export default function JobsGrid() {

  const navigate = useNavigate();

  const handleAddJob = () => {
    navigate("/jobs/new");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Jobs" />
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sampleJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}

            {/* Add New Job Card */}
            <button onClick={handleAddJob} className="group p-4 rounded-2xl border-2 border-dashed border-border dark:border-slate-600 hover:border-primary/50 bg-muted/20 dark:bg-slate-800/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-4 min-h-[240px]">
              <div className="p-4 rounded-full bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors shadow-sm">
                <Plus className="w-8 h-8 text-primary dark:text-primary/80" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground dark:text-slate-100 mb-1">
                  Thêm công việc mới
                </p>
                <p className="text-sm text-muted-foreground dark:text-slate-300">
                  Tạo vị trí tuyển dụng mới
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
