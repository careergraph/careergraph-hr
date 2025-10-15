import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SuggestionCandidate } from "@/types/candidate";
import { Heart, Share2, Lock, Phone, Mail, MapPin, GraduationCap, Briefcase, Target, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateDetailProps {
  candidate: SuggestionCandidate | null;
}

export const CandidateDetail = ({ candidate }: CandidateDetailProps) => {
  if (!candidate) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground py-12">
          <p>Chọn ứng viên để xem thông tin chi tiết</p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500'];
    return colors[parseInt(id) % colors.length];
  };

  const InfoRow = ({ 
    icon: Icon, 
    label, 
    value, 
    masked = false 
  }: { 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any; 
    label: string; 
    value: string; 
    masked?: boolean;
  }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {masked ? (
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-primary" />
            <span className="text-sm font-medium text-primary">Thông tin đã ẩn</span>
          </div>
        ) : (
          <p className="text-sm font-medium text-foreground break-words">{value}</p>
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <Avatar className="h-24 w-24 flex-shrink-0">
              {candidate.avatar ? (
                <AvatarImage src={candidate.avatar} alt={candidate.name} />
              ) : (
                <AvatarFallback className={cn("text-white text-2xl font-semibold", getAvatarColor(candidate.id))}>
                  {getInitials(candidate.name)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-foreground mb-1">{candidate.name}</h2>
              <p className="text-muted-foreground mb-2">{candidate.position}</p>
              <Badge variant="secondary">{candidate.lastActive}</Badge>
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!candidate.hasPurchased && (
          <Button className="w-full" size="lg">
            <Lock className="h-4 w-4 mr-2" />
            Mua thông tin liên hệ (-2 điểm)
          </Button>
        )}
        
        {candidate.hasPurchased && (
          <p className="text-sm text-muted-foreground text-center">Bạn còn 0 điểm</p>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Contact Information */}
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Thông tin liên hệ
          </h3>
          <div className="space-y-1 bg-muted/30 rounded-lg p-4">
            <InfoRow
              icon={Phone}
              label="Số điện thoại"
              value={candidate.phone || ""}
              masked={!candidate.hasPurchased}
            />
            <InfoRow
              icon={Mail}
              label="Email"
              value={candidate.email || ""}
              masked={!candidate.hasPurchased}
            />
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tình trạng hôn nhân</p>
              <p className="text-sm font-medium text-foreground">{candidate.maritalStatus}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ngày sinh & Giới tính</p>
              <p className="text-sm font-medium text-foreground">{candidate.birthYear} - {candidate.gender}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tỉnh / Thành phố</p>
              <p className="text-sm font-medium text-foreground">{candidate.location.city}, {candidate.location.province}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Địa chỉ</p>
              <p className="text-sm font-medium text-foreground">{candidate.address || "-"}</p>
            </div>
          </div>
        </div>

        {/* Education & Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <InfoRow
              icon={GraduationCap}
              label="Trình độ học vấn"
              value={candidate.education}
            />
          </div>
          <div>
            <InfoRow
              icon={Briefcase}
              label="Số năm kinh nghiệm"
              value={candidate.yearsOfExperience}
            />
          </div>
          <div>
            <InfoRow
              icon={Target}
              label="Cấp bậc hiện tại"
              value={candidate.currentLevel}
            />
          </div>
          <div>
            <InfoRow
              icon={Target}
              label="Cấp bậc mong muốn"
              value={candidate.desiredLevel}
            />
          </div>
        </div>

        {/* Work Preferences */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Mong muốn công việc</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InfoRow
                icon={DollarSign}
                label="Mức lương mong muốn"
                value={candidate.desiredSalary}
              />
            </div>
            <div>
              <InfoRow
                icon={MapPin}
                label="Địa điểm làm việc mong muốn"
                value={candidate.workLocation}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hình thức làm việc</p>
              <p className="text-sm font-medium text-foreground">{candidate.workType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nghề nghiệp</p>
              <p className="text-sm font-medium text-foreground">{candidate.industry}</p>
            </div>
          </div>
        </div>

        {/* Skills */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Kỹ năng</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
