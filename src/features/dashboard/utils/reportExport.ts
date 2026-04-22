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

  const header = "Thang,Tong ung vien chuyen buoc";
  const body = rows.map((item) => `${item.monthLabel},${item.totalTransitions}`).join("\n");
  triggerDownload(`${header}\n${body}`, "pipeline-velocity.csv", "text/csv;charset=utf-8;");

  return true;
};

export const exportPipelinePdf = (data?: DashboardPipelineVelocity | null) => {
  const rows = data?.monthly ?? [];
  if (!rows.length) {
    return false;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text("Bao cao toc do pipeline", 40, 40);

  autoTable(doc, {
    startY: 60,
    head: [["Thang", "Tong ung vien chuyen buoc"]],
    body: rows.map((item) => [item.monthLabel, item.totalTransitions.toLocaleString("vi-VN")]),
    styles: {
      fontSize: 10,
    },
  });

  doc.save("pipeline-velocity.pdf");
  return true;
};

export const exportHiringTargetPdf = (data?: DashboardHiringTargetProgress | null) => {
  if (!data) {
    return false;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text("Bao cao tien do tuyen dung", 40, 40);

  autoTable(doc, {
    startY: 60,
    head: [["Chi so", "Gia tri"]],
    body: [
      ["Ty le hoan thanh", `${data.completionPercent.toFixed(1)}%`],
      ["Thay doi so voi ky truoc", `${data.changePercent.toFixed(1)}%`],
      ["Muc tieu quy", `${data.quarterTargetPositions.toLocaleString("vi-VN")} vi tri`],
      ["Da tuyen tuan nay", `${data.hiredThisWeek.toLocaleString("vi-VN")} ung vien`],
      ["Offer dang cho", `${data.pendingOffers.toLocaleString("vi-VN")} offer`],
    ],
    styles: {
      fontSize: 10,
    },
  });

  doc.save("hiring-target-progress.pdf");
  return true;
};
