import { Briefcase, Users, CheckCircle, Star, UserCheck, FileCheck, Gift, Search, Ban } from "lucide-react";
import type { Status as CandidateStatus } from "@/types/candidate";

export const KANBAN_STAGE_META: Record<
  CandidateStatus,
  {
    accent: string;
    border: string;
    badge: string;
    icon: React.ReactNode;
  }
> = {
  apply: {
    accent: "from-blue-400/60 via-blue-500/30 to-transparent",
    border: "border-blue-100/70",
    badge: "bg-blue-500/10 text-blue-600",
    icon: <Briefcase className="h-5 w-5 text-blue-500" />,
  },
  screening: {
    accent: "from-amber-400/60 via-amber-400/20 to-transparent",
    border: "border-amber-100/70",
    badge: "bg-amber-500/10 text-amber-600",
    icon: <Search className="h-5 w-5 text-amber-500" />,
  },
  contacted: {
    accent: "from-cyan-500/60 via-cyan-400/20 to-transparent",
    border: "border-cyan-100/70",
    badge: "bg-cyan-500/10 text-cyan-600",
    icon: <Users className="h-5 w-5 text-cyan-500" />,
  },
  interview: {
    accent: "from-purple-500/60 via-purple-400/20 to-transparent",
    border: "border-purple-100/70",
    badge: "bg-purple-500/10 text-purple-600",
    icon: <UserCheck className="h-5 w-5 text-purple-500" />,
  },
  interviewed: {
    accent: "from-indigo-500/60 via-indigo-400/20 to-transparent",
    border: "border-indigo-100/70",
    badge: "bg-indigo-500/10 text-indigo-600",
    icon: <FileCheck className="h-5 w-5 text-indigo-500" />,
  },
  trial: {
    accent: "from-orange-500/60 via-orange-400/25 to-transparent",
    border: "border-orange-100/70",
    badge: "bg-orange-500/10 text-orange-600",
    icon: <Star className="h-5 w-5 text-orange-500" />,
  },
  offer: {
    accent: "from-teal-500/60 via-teal-400/20 to-transparent",
    border: "border-teal-100/70",
    badge: "bg-teal-500/10 text-teal-600",
    icon: <Gift className="h-5 w-5 text-teal-500" />,
  },
  hired: {
    accent: "from-emerald-500/60 via-emerald-400/20 to-transparent",
    border: "border-emerald-100/70",
    badge: "bg-emerald-500/10 text-emerald-600",
    icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  },
  offboarded: {
    accent: "from-slate-500/60 via-slate-400/20 to-transparent",
    border: "border-slate-100/70",
    badge: "bg-slate-500/10 text-slate-600",
    icon: <Ban className="h-5 w-5 text-slate-500" />,
  },
  rejected: {
    accent: "from-rose-500/60 via-rose-400/20 to-transparent",
    border: "border-rose-100/70",
    badge: "bg-rose-500/10 text-rose-600",
    icon: <Ban className="h-5 w-5 text-rose-500" />,
  },
  custom_1: {
    accent: "from-slate-400/60 via-slate-300/20 to-transparent",
    border: "border-slate-200/70",
    badge: "bg-slate-100 text-slate-700",
    icon: <CheckCircle className="h-5 w-5 text-slate-500" />,
  },
  custom_2: {
    accent: "from-slate-400/60 via-slate-300/20 to-transparent",
    border: "border-slate-200/70",
    badge: "bg-slate-100 text-slate-700",
    icon: <CheckCircle className="h-5 w-5 text-slate-500" />,
  },
  custom_3: {
    accent: "from-slate-400/60 via-slate-300/20 to-transparent",
    border: "border-slate-200/70",
    badge: "bg-slate-100 text-slate-700",
    icon: <CheckCircle className="h-5 w-5 text-slate-500" />,
  },
  custom_4: {
    accent: "from-slate-400/60 via-slate-300/20 to-transparent",
    border: "border-slate-200/70",
    badge: "bg-slate-100 text-slate-700",
    icon: <CheckCircle className="h-5 w-5 text-slate-500" />,
  },
  custom_5: {
    accent: "from-slate-400/60 via-slate-300/20 to-transparent",
    border: "border-slate-200/70",
    badge: "bg-slate-100 text-slate-700",
    icon: <CheckCircle className="h-5 w-5 text-slate-500" />,
  },
};
