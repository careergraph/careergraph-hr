import { useNavigate } from "react-router";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/sessionNotice";
import type { CompanyProfile } from "@/types/account";

interface VerificationStatusBannerProps {
  company: CompanyProfile | null | undefined;
}

const VerificationStatusBanner: React.FC<VerificationStatusBannerProps> = ({ company }) => {
  const navigate = useNavigate();

  if (!company) return null;

  const status = company.verificationStatus;
  const operationalStatus = company.operationalStatus;

  if (operationalStatus === "BLOCKED" || operationalStatus === "SUSPENDED") {
    return (
      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900">Công ty bị khóa</h3>
            <p className="mt-1 text-sm text-red-800">
              {company.blockedReason ||
                `Tài khoản HR hoặc doanh nghiệp của bạn hiện đang bị khóa. Vui lòng liên hệ ${SUPPORT_EMAIL} để giải trình và nhận hỗ trợ.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "NOT_SUBMITTED") {
    return (
      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-900">Xác thực công ty cần thiết</h3>
            <p className="mt-1 text-sm text-yellow-800">
              Vui lòng xác thực thông tin công ty để có thể đăng tải công việc.
            </p>
            <button
              onClick={() => navigate("/company/verification")}
              className="mt-3 rounded bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
            >
              Xác thực ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "PENDING_REVIEW") {
    return (
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900">Đang chờ xét duyệt</h3>
            <p className="mt-1 text-sm text-blue-800">
              Yêu cầu xác thực công ty của bạn đang được xét duyệt. Vui lòng chờ kết quả.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900">Xác thực bị từ chối</h3>
            {company.verificationAdminNote ? (
              <p className="mt-1 text-sm text-red-800">Lý do: {company.verificationAdminNote}</p>
            ) : null}
            <button
              onClick={() => navigate("/company/verification")}
              className="mt-3 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Gửi lại yêu cầu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "NEEDS_ADDITIONAL_INFO") {
    return (
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-900">Cần thêm thông tin</h3>
            {company.verificationAdminNote ? (
              <p className="mt-1 text-sm text-amber-800">{company.verificationAdminNote}</p>
            ) : null}
            <button
              onClick={() => navigate("/company/verification")}
              className="mt-3 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Cập nhật thông tin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // if (status === "APPROVED") {
  //   return (
  //     <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
  //       <div className="flex items-start gap-3">
  //         <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
  //         <div className="flex-1">
  //           <h3 className="font-medium text-green-900">Công ty đã xác thực</h3>
  //           <p className="mt-1 text-sm text-green-800">
  //             Thông tin công ty của bạn đã được xác thực và phê duyệt.
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return null;
};

export default VerificationStatusBanner;
