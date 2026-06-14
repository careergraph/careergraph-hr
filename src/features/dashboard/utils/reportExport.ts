import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  DashboardHiringTargetProgress,
  DashboardPipelineVelocity,
} from "@/features/dashboard/types/dashboard.types";

const triggerDownload = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportPipelineCsv = (data?: DashboardPipelineVelocity | null) => {
  const rows = data?.monthly ?? [];
  if (!rows.length) {
    return false;
  }

  const header = "Tháng,Tổng ứng viên chuyển bước";
  const body = rows.map((item) => `${item.monthLabel},${item.totalTransitions}`).join("\n");
  triggerDownload(`${header}\n${body}`, "toc-do-quy-trinh-tuyen-dung.csv", "text/csv;charset=utf-8;");

  return true;
};

export const exportPipelinePdf = (data?: DashboardPipelineVelocity | null) => {
  const rows = data?.monthly ?? [];
  if (!rows.length) {
    return false;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text("Báo cáo tốc độ quy trình tuyển dụng", 40, 40);

  autoTable(doc, {
    startY: 60,
    head: [["Tháng", "Tổng ứng viên chuyển bước"]],
    body: rows.map((item) => [item.monthLabel, item.totalTransitions.toLocaleString("vi-VN")]),
    styles: {
      fontSize: 10,
    },
  });

  doc.save("toc-do-quy-trinh-tuyen-dung.pdf");
  return true;
};

export const exportHiringTargetPdf = (data?: DashboardHiringTargetProgress | null) => {
  if (!data) {
    return false;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text("Báo cáo tiến độ tuyển dụng", 40, 40);

  autoTable(doc, {
    startY: 60,
    head: [["Chỉ số", "Giá trị"]],
    body: [
      ["Tỷ lệ hoàn thành", `${data.completionPercent.toFixed(1)}%`],
      ["Thay đổi so với kỳ trước", `${data.changePercent.toFixed(1)}%`],
      ["Mục tiêu quý", `${data.quarterTargetPositions.toLocaleString("vi-VN")} vị trí`],
      ["Đã tuyển tuần này", `${data.hiredThisWeek.toLocaleString("vi-VN")} ứng viên`],
      ["Thư mời nhận việc đang chờ", `${data.pendingOffers.toLocaleString("vi-VN")} thư`],
    ],
    styles: {
      fontSize: 10,
    },
  });

  doc.save("tien-do-tuyen-dung.pdf");
  return true;
};
