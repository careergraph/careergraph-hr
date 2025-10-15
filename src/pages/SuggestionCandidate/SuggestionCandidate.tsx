import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CandidateCard } from "./CandidateCard";
import { CandidateDetail } from "./CandidateDetail";
import { SuggestionCandidate } from "@/types/candidate";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";

const mockCandidates: SuggestionCandidate[] = [
  {
    id: "1",
    name: "Lê Hồng Tùng",
    age: 36,
    avatar: "",
    position: "Nhân Viên Tư Vấn Tài Chính",
    experience: "Chưa có kinh nghiệm",
    lastActive: "vài giây trước",
    phone: "0123456789",
    email: "lehongtung@email.com",
    gender: "Nam",
    birthYear: 1989,
    maritalStatus: "Độc thân",
    location: { city: "Thanh Hóa", province: "Thanh Hóa" },
    address: "TDP Hồng Kỳ, P. Ngọc Sơn, Thanh Hóa",
    education: "Đại học",
    yearsOfExperience: "Chưa có kinh nghiệm",
    currentLevel: "Nhân viên",
    desiredLevel: "Nhân viên",
    desiredSalary: "6,000,000 (VNĐ)",
    workLocation: "Thanh Hóa",
    workType: "Toàn thời gian cố định",
    industry: "Tài chính - Đầu tư - Chứng Khoán",
    skills: ["Tư vấn tài chính", "Phân tích thị trường", "Quản lý rủi ro"],
    hasPurchased: false,
    ticketId: "TCKT-001",
    priority: "normal",
    status: "New",
    appliedDate: "2024-06-01",
    source: "Website",
    resumeUrl: "https://example.com/resume1.pdf",
    notes: "Ứng viên tiềm năng",
  },
  {
    id: "2",
    name: "Lê Hồng Tùng",
    age: 36,
    avatar: "",
    position: "Nhân Viên Tư Vấn Tài Chính",
    experience: "Chưa có kinh nghiệm",
    lastActive: "vài giây trước",
    phone: "0123456789",
    email: "lehongtung@email.com",
    gender: "Nam",
    birthYear: 1989,
    maritalStatus: "Độc thân",
    location: { city: "Thanh Hóa", province: "Thanh Hóa" },
    address: "TDP Hồng Kỳ, P. Ngọc Sơn, Thanh Hóa",
    education: "Đại học",
    yearsOfExperience: "Chưa có kinh nghiệm",
    currentLevel: "Nhân viên",
    desiredLevel: "Nhân viên",
    desiredSalary: "6,000,000 (VNĐ)",
    workLocation: "Thanh Hóa",
    workType: "Toàn thời gian cố định",
    industry: "Tài chính - Đầu tư - Chứng Khoán",
    skills: ["Tư vấn tài chính", "Phân tích thị trường", "Quản lý rủi ro"],
    hasPurchased: false,
    ticketId: "TCKT-001",
    priority: "normal",
    status: "New",
    appliedDate: "2024-06-01",
    source: "Website",
    resumeUrl: "https://example.com/resume1.pdf",
    notes: "Ứng viên tiềm năng",
  },
];

export default function SuggestionCandidates() {
  const [selectedCandidate, setSelectedCandidate] =
    useState<SuggestionCandidate | null>(mockCandidates[0]);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Search */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:max-w-3xl">
              <div className="flex gap-2">
                {/* Input search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm ứng viên mới..."
                    className="pl-10 pr-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Dropdown location */}
                <Select defaultValue="all">
                  <SelectTrigger className="w-[160px] rounded-xl border-border focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Toàn quốc" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 shadow-lg rounded-xl">
                    <SelectItem value="all">Toàn quốc</SelectItem>
                    <SelectItem value="hanoi">Hà Nội</SelectItem>
                    <SelectItem value="hcm">Hồ Chí Minh</SelectItem>
                    <SelectItem value="danang">Đà Nẵng</SelectItem>
                  </SelectContent>
                </Select>

                {/* Nút tìm kiếm */}
                <Button className="rounded-xl px-5">
                  <Search className="h-4 w-4 mr-2" />
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-between py-4 bg-card border-b">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Candidates List */}
          <div className="lg:col-span-4 xl:col-span-4">
            <Card className="p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">
                  {mockCandidates.length.toLocaleString()} Ứng viên
                </h2>
                <Select defaultValue="newest">
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 z-50">
                    <SelectItem value="newest">Cập nhật mới nhất</SelectItem>
                    <SelectItem value="relevant">Phù hợp nhất</SelectItem>
                    <SelectItem value="experience">Kinh nghiệm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {mockCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={selectedCandidate?.id === candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Candidate Detail */}
          <div className="lg:col-span-8 xl:col-span-8 mt-2">
            <CandidateDetail candidate={selectedCandidate} />
          </div>
        </div>
      </div>
    </div>
  );
}
