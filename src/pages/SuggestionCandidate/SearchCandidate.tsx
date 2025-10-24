import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import useLocation from "@/hooks/use-location";

const SearchCandidate = () => {
  // Search và filter candidate
  const [searchQuery, setSearchQuery] = useState("");

  // Gọi hook lấy location
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const { provinces, loadingProvinces } = useLocation();

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto mb-4">
        <div className="flex justify-between items-center gap-4">
          {/* Search Bar */}
          <div className="flex-1 max-w relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Vị trí cần tuyển"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
            />
          </div>

          {/* Location Select */}
          <div className="flex-shrink-0">
            <Select
              value={selectedProvince}
              onValueChange={(value) => setSelectedProvince(value)}
            >
              <SelectTrigger className="w-[200px] h-12 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Chọn tỉnh/thành" />
              </SelectTrigger>

              <SelectContent className="z-[50] mt-1 rounded-lg border border-gray-200 shadow-lg bg-white dark:bg-slate-900 max-h-[250px] overflow-y-auto">
                <SelectItem
                  value="all"
                  className="hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md"
                >
                  Toàn quốc
                </SelectItem>

                {loadingProvinces ? (
                  <SelectItem value="loading" disabled>
                    Đang tải...
                  </SelectItem>
                ) : (
                  provinces.map((province) => (
                    <SelectItem
                      key={province.code}
                      value={province.code.toString()}
                      className="hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md"
                    >
                      {province.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SearchCandidate;
