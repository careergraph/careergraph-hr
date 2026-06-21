import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Check, Upload, X, Loader2, AlertTriangle, XCircle } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import { useAuthStore } from "@/stores/authStore";
import companyVerificationService, {
  type CompanyVerificationRequest,
  type VerificationDocument,
} from "@/services/companyVerificationService";

interface DocumentSlot {
  label: string;
  documentType: string;
  required: boolean;
  file: File | null;
  uploadedDoc: VerificationDocument | null;
  uploading: boolean;
  error: string | null;
}

const DOCUMENT_SLOTS: Array<Omit<DocumentSlot, "file" | "uploadedDoc" | "uploading" | "error">> = [
  {
    label: "Giấy phép kinh doanh",
    documentType: "BUSINESS_LICENSE",
    required: true,
  },
  {
    label: "Giấy chứng nhận đăng ký thuế",
    documentType: "TAX_CERTIFICATE",
    required: true,
  },
  {
    label: "CMND/CCCD Đại diện pháp lý",
    documentType: "CEO_ID",
    required: false,
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes, k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateStr));
};

const CompanyVerificationPage = () => {
  const navigate = useNavigate();
  const { company } = useAuthStore();
  const companyId = company?.id ?? "";

  const [verificationData, setVerificationData] = useState<CompanyVerificationRequest>({
    taxCode: "",
    companyName: company?.name ?? "",
    legalRepresentativeName: company?.ceoName ?? "",
    businessEmail: company?.email ?? "",
    website: company?.website ?? "",
  });

  const [documentSlots, setDocumentSlots] = useState<DocumentSlot[]>(
    DOCUMENT_SLOTS.map((slot) => ({
      ...slot,
      file: null,
      uploadedDoc: null,
      uploading: false,
      error: null,
    }))
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestRequest, setLatestRequest] = useState<CompanyVerificationRequest | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<CompanyVerificationRequest[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadVerificationData = async () => {
      setIsLoading(true);
      try {
        const [status, history] = await Promise.all([
          companyVerificationService.getVerificationStatus(),
          companyVerificationService.listMyRequests(),
        ]);

        if (status?.latestRequest) {
          setLatestRequest(status.latestRequest);
          setVerificationData(status.latestRequest);

          // Pre-populate documents for resubmit
          const currentStatus = status.latestRequest.verificationStatus;
          const isResubmit = currentStatus === "REJECTED" || currentStatus === "NEEDS_ADDITIONAL_INFO";
          if (isResubmit && status.latestRequest.documents?.length) {
            const initialSlots = DOCUMENT_SLOTS.map((slot) => {
              const existingDoc = status.latestRequest.documents?.find(
                (d) => d.documentType === slot.documentType
              );
              return {
                ...slot,
                file: null,
                uploadedDoc: existingDoc
                  ? {
                      documentUrl: existingDoc.documentUrl,
                      documentType: existingDoc.documentType,
                      originalFileName: existingDoc.originalFileName,
                      mimeType: existingDoc.mimeType,
                    }
                  : null,
                uploading: false,
                error: null,
              };
            });
            setDocumentSlots(initialSlots);
          }
        }

        setVerificationHistory(history || []);
      } catch (error) {
        console.error("Failed to load verification data:", error);
        toast.error("Không thể tải thông tin xác thực");
      } finally {
        setIsLoading(false);
      }
    };

    loadVerificationData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVerificationData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleDocumentDrop = useCallback(
    (index: number) => (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      if (file.size > MAX_FILE_SIZE) {
        setDocumentSlots((prev) => {
          const updated = [...prev];
          updated[index].error = `File quá lớn. Tối đa ${formatFileSize(MAX_FILE_SIZE)}`;
          return updated;
        });
        return;
      }

      setDocumentSlots((prev) => {
        const updated = [...prev];
        updated[index].file = file;
        updated[index].error = null;
        return updated;
      });

      uploadDocumentFile(index, file);
    },
    [companyId]
  );

  const uploadDocumentFile = async (index: number, file: File) => {
    setDocumentSlots((prev) => {
      const updated = [...prev];
      updated[index].uploading = true;
      return updated;
    });

    try {
      const uploadedDoc = await companyVerificationService.uploadDocument(file, companyId);

      if (uploadedDoc) {
        setDocumentSlots((prev) => {
          const updated = [...prev];
          updated[index].uploadedDoc = uploadedDoc;
          updated[index].uploading = false;
          updated[index].error = null;
          return updated;
        });
        toast.success(`${DOCUMENT_SLOTS[index].label} đã tải lên thành công`);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      setDocumentSlots((prev) => {
        const updated = [...prev];
        updated[index].uploading = false;
        updated[index].error = "Tải lên thất bại. Vui lòng thử lại.";
        return updated;
      });
      toast.error("Lỗi tải lên tài liệu");
    }
  };

  const removeDocument = (index: number) => {
    setDocumentSlots((prev) => {
      const updated = [...prev];
      updated[index].file = null;
      updated[index].uploadedDoc = null;
      updated[index].error = null;
      return updated;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!verificationData.taxCode?.trim()) {
      errors.taxCode = "Mã số thuế không được trống";
    } else if (!/^\d{10}$/.test(verificationData.taxCode.trim())) {
      errors.taxCode = "Mã số thuế phải là 10 chữ số";
    }

    if (!verificationData.companyName?.trim()) {
      errors.companyName = "Tên công ty không được trống";
    }

    if (!verificationData.legalRepresentativeName?.trim()) {
      errors.legalRepresentativeName = "Tên đại diện pháp lý không được trống";
    }

    if (!verificationData.businessEmail?.trim()) {
      errors.businessEmail = "Email doanh nghiệp không được trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verificationData.businessEmail.trim())) {
      errors.businessEmail = "Email không hợp lệ";
    }

    for (let i = 0; i < documentSlots.length; i++) {
      if (documentSlots[i].required && !documentSlots[i].uploadedDoc) {
        errors[`document-${i}`] = "Tài liệu bắt buộc";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setIsSubmitting(true);
    try {
      const documents = documentSlots
        .filter((slot) => slot.uploadedDoc)
        .map((slot) => ({
          documentUrl: slot.uploadedDoc!.documentUrl,
          documentType: slot.documentType,
          originalFileName: slot.uploadedDoc!.originalFileName,
          mimeType: slot.uploadedDoc!.mimeType,
        }));

      const payload: CompanyVerificationRequest = {
        taxCode: verificationData.taxCode,
        companyName: verificationData.companyName,
        legalRepresentativeName: verificationData.legalRepresentativeName,
        businessEmail: verificationData.businessEmail,
        website: verificationData.website,
        documents,
      };

      const requestId = latestRequest?.requestId;
      if (requestId) {
        await companyVerificationService.updateVerification(requestId, payload);
        toast.success("Đã gửi lại yêu cầu xác thực công ty.");
      } else {
        await companyVerificationService.submitVerification(payload);
        toast.success("Đã gửi yêu cầu xác thực công ty. Vui lòng chờ xét duyệt.");
      }

      // Reload status without navigating away
      const newStatus = await companyVerificationService.getVerificationStatus();
      const refreshedLatest = newStatus?.latestRequest ?? null;
      setLatestRequest(refreshedLatest);
      setVerificationData((prev) => ({
        ...prev,
        ...(refreshedLatest ?? {}),
      }));
      setDocumentSlots(
        DOCUMENT_SLOTS.map((slot) => {
          const existingDoc = refreshedLatest?.documents?.find(
            (doc) => doc.documentType === slot.documentType
          );
          return {
            ...slot,
            file: null,
            uploadedDoc: existingDoc ?? null,
            uploading: false,
            error: null,
          };
        })
      );

      // Reload history
      const history = await companyVerificationService.listMyRequests();
      setVerificationHistory(history || []);
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message || "Không thể gửi yêu cầu xác thực. Vui lòng thử lại.";
      toast.error(errorMsg);
      console.error("Verification submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 dark:bg-gray-950">
        <PageMeta title="Xác thực công ty" description="Đang tải..." />
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Đang tải thông tin...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = latestRequest?.verificationStatus;
  const isResubmit = currentStatus === "REJECTED" || currentStatus === "NEEDS_ADDITIONAL_INFO";
  const canEdit = !latestRequest || isResubmit;

  const getStatusBadge = () => {
    if (!latestRequest) return null;

    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING_REVIEW: {
        label: "Đang chờ xét duyệt",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      },
      APPROVED: {
        label: "Đã xác thực",
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      },
      REJECTED: {
        label: "Bị từ chối",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      },
      NEEDS_ADDITIONAL_INFO: {
        label: "Cần bổ sung thông tin",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      },
    };

    const status = statusMap[currentStatus!] || statusMap.PENDING_REVIEW;

    return (
      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
        {status.label}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 dark:bg-gray-950">
      <PageMeta
        title="Xác thực công ty"
        description="Xác thực thông tin công ty để có thể đăng tải công việc"
      />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Xác thực công ty
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isResubmit
              ? "Vui lòng cập nhật thông tin và gửi lại yêu cầu xác thực."
              : canEdit
                ? "Vui lòng cung cấp thông tin công ty để hoàn tất quá trình xác thực."
                : "Yêu cầu xác thực của bạn đang trong quá trình xét duyệt."}
          </p>
        </div>

        {/* Status Banner */}
        {latestRequest && (
          <div className="mb-6 flex items-start gap-3">
            <div>{getStatusBadge()}</div>
          </div>
        )}

        {/* Info Banners */}
        {currentStatus === "NEEDS_ADDITIONAL_INFO" && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-900/20 dark:border-amber-800 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Admin yêu cầu bổ sung thông tin
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                {latestRequest.adminNote}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-2">
                Vui lòng cập nhật thông tin và tài liệu, sau đó nhấn "Gửi lại".
              </p>
            </div>
          </div>
        )}

        {currentStatus === "REJECTED" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/20 dark:border-red-800 flex gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-200">Yêu cầu bị từ chối</p>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                Lý do: {latestRequest.adminNote}
              </p>
              <p className="text-sm text-red-800 dark:text-red-300 mt-2">
                Bạn có thể gửi lại yêu cầu mới với thông tin đã cập nhật.
              </p>
            </div>
          </div>
        )}

        {!canEdit && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl dark:bg-blue-900/20 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              Yêu cầu xác thực của bạn đang trong quá trình xét duyệt. Không thể chỉnh sửa vào lúc
              này. Vui lòng quay lại sau khi nhận kết quả từ admin.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Thông tin cơ bản */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">
              Thông tin cơ bản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tax Code */}
              <div>
                <label
                  htmlFor="taxCode"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Mã số thuế <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="taxCode"
                  name="taxCode"
                  value={verificationData.taxCode ?? ""}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="Nhập mã số thuế (10 chữ số)"
                />
                {validationErrors.taxCode && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {validationErrors.taxCode}
                  </p>
                )}
              </div>

              {/* Company Name */}
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Tên công ty <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={verificationData.companyName ?? ""}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="Nhập tên công ty"
                />
                {validationErrors.companyName && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {validationErrors.companyName}
                  </p>
                )}
              </div>

              {/* Legal Representative */}
              <div>
                <label
                  htmlFor="legalRepresentativeName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Tên đại diện pháp lý <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="legalRepresentativeName"
                  name="legalRepresentativeName"
                  value={verificationData.legalRepresentativeName ?? ""}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="Nhập tên đại diện pháp lý"
                />
                {validationErrors.legalRepresentativeName && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {validationErrors.legalRepresentativeName}
                  </p>
                )}
              </div>

              {/* Business Email */}
              <div>
                <label
                  htmlFor="businessEmail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email doanh nghiệp <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="businessEmail"
                  name="businessEmail"
                  value={verificationData.businessEmail ?? ""}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="Nhập email doanh nghiệp"
                />
                {validationErrors.businessEmail && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {validationErrors.businessEmail}
                  </p>
                )}
              </div>

              {/* Website */}
              <div className="md:col-span-2">
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Website (tùy chọn)
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={verificationData.website ?? ""}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tài liệu đã nộp (read-only view) */}
          {!canEdit && latestRequest?.documents && latestRequest.documents.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">
                Tài liệu đã nộp
              </h2>
              <div className="space-y-3">
                {latestRequest.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {doc.originalFileName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.documentType}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex-shrink-0"
                    >
                      Xem
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Tài liệu xác thực (edit view) */}
          {canEdit && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">
                Tài liệu xác thực
              </h2>

              <div className="space-y-5">
                {documentSlots.map((slot, index) => (
                  <DocumentSlotComponent
                    key={index}
                    slot={slot}
                    slotIndex={index}
                    onDrop={handleDocumentDrop(index)}
                    onRemove={() => removeDocument(index)}
                    hasError={!!validationErrors[`document-${index}`]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Submit */}
          {canEdit && (
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {latestRequest?.requestId ? "Gửi lại yêu cầu" : "Gửi yêu cầu xác thực"}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Hủy
              </button>
            </div>
          )}
        </form>

        {/* Section 5: Verification History */}
        {verificationHistory.length > 0 && (
          <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">
              Lịch sử yêu cầu xác thực
            </h2>
            <div className="space-y-4">
              {verificationHistory.map((request, index) => (
                <div
                  key={request.requestId || index}
                  className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0"
                >
                  <div className="flex-shrink-0 mt-1">
                    {request.verificationStatus === "APPROVED" && (
                      <div className="h-3 w-3 rounded-full bg-green-600"></div>
                    )}
                    {request.verificationStatus === "REJECTED" && (
                      <div className="h-3 w-3 rounded-full bg-red-600"></div>
                    )}
                    {request.verificationStatus === "NEEDS_ADDITIONAL_INFO" && (
                      <div className="h-3 w-3 rounded-full bg-amber-600"></div>
                    )}
                    {request.verificationStatus === "PENDING_REVIEW" && (
                      <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.verificationStatus === "PENDING_REVIEW" && "Chờ xét duyệt"}
                        {request.verificationStatus === "APPROVED" && "Đã xác thực"}
                        {request.verificationStatus === "REJECTED" && "Bị từ chối"}
                        {request.verificationStatus === "NEEDS_ADDITIONAL_INFO" && "Cần bổ sung"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(request.submittedAt)}
                      </p>
                    </div>
                    {request.adminNote && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {request.adminNote}
                      </p>
                    )}
                    {request.documents && request.documents.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {request.documents.map((document, docIndex) => (
                          <a
                            key={document.id || `${request.requestId || index}-${docIndex}`}
                            href={document.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-blue-700 hover:text-blue-800 dark:border-gray-700 dark:text-blue-300"
                          >
                            {document.originalFileName || document.documentType || "TÃ i liá»‡u"}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface DocumentSlotComponentProps {
  slot: DocumentSlot;
  slotIndex: number;
  onDrop: (files: File[]) => void;
  onRemove: () => void;
  hasError: boolean;
}

const DocumentSlotComponent: React.FC<DocumentSlotComponentProps> = ({
  slot,
  slotIndex,
  onDrop,
  onRemove,
  hasError,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/*": [".jpg", ".jpeg", ".png"] },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: slot.uploading,
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {slot.label} {slot.required && <span className="text-red-500">*</span>}
        </label>
        {slot.uploadedDoc && <Check className="h-4 w-4 text-green-600" />}
      </div>

      {!slot.uploadedDoc && !slot.uploading ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-25 dark:border-blue-500 dark:bg-blue-950/20"
              : "border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
          } ${hasError ? "border-red-300 dark:border-red-700" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDragActive ? "Thả file tại đây" : "Kéo thả file hoặc click để chọn"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PDF, JPG, PNG • Tối đa {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </div>
          </div>
        </div>
      ) : slot.uploading ? (
        <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-blue-50/80 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.45)_40%,transparent_60%)] animate-[shimmer_1.4s_linear_infinite]" />
          <div className="relative flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Đang tải tài liệu lên
              </p>
              <p className="mt-1 truncate text-sm text-blue-800/90 dark:text-blue-200/90">
                {slot.file?.name || slot.uploadedDoc?.originalFileName || "Tài liệu xác thực"}
              </p>
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                Hệ thống đang lưu tệp để gắn vào hồ sơ xác thực. Vui lòng chờ trong giây lát.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {slot.uploading ? (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
            ) : (
              <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {slot.file?.name || slot.uploadedDoc.originalFileName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {slot.uploading
                  ? "Đang tải lên..."
                  : `${formatFileSize(slot.file?.size || 0)} • Hoàn tất`}
              </p>
            </div>
          </div>
          {!slot.uploading && (
            <button
              type="button"
              onClick={onRemove}
              className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {slot.error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{slot.error}</p>}
      {hasError && !slot.error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">Tài liệu bắt buộc</p>
      )}
    </div>
  );
};

export default CompanyVerificationPage;
