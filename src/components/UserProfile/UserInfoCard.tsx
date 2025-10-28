import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { Modal } from "../custom/modal";
import Button from "../custom/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuthStore } from "@/stores/authStore";

export default function UserInfoCard() {
  const { user, company } = useAuthStore();
  const { isOpen, openModal, closeModal } = useModal();

  const [formValues, setFormValues] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    jobTitle: user?.jobTitle ?? user?.role ?? "",
  });

  useEffect(() => {
    setFormValues({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      jobTitle: user?.jobTitle ?? user?.role ?? "",
    });
  }, [user?.firstName, user?.lastName, user?.email, user?.phoneNumber, user?.jobTitle, user?.role]);

  const bio = useMemo(() => {
    if (company?.ceoName) return `CEO: ${company.ceoName}`;
    if (company?.size) return `Quy mô: ${company.size}`;
    if (company?.website) return `Website: ${company.website}`;
    return formValues.jobTitle || "Chưa cập nhật";
  }, [company?.ceoName, company?.size, company?.website, formValues.jobTitle]);

  const handleChange = (field: keyof typeof formValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = () => {
    closeModal();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 lg:mb-6">Thông tin cá nhân</h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <InfoRow label="Họ" value={user?.firstName ?? "-"} />
            <InfoRow label="Tên" value={user?.lastName ?? "-"} />
            <InfoRow label="Email" value={user?.email ?? "-"} />
            <InfoRow label="Số điện thoại" value={user?.phoneNumber ?? "Chưa cập nhật"} />
            <InfoRow label="Chức danh" value={formValues.jobTitle || "Chưa cập nhật"} />
            <InfoRow label="Mô tả" value={bio} fullWidth />
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.05] dark:hover:text-gray-100 lg:inline-flex lg:w-auto"
        >
          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill="currentColor"
            />
          </svg>
          Chỉnh sửa
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[700px]">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-10">
            <h4 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">Cập nhật thông tin</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Chỉnh sửa thông tin để đồng bộ với hồ sơ doanh nghiệp.</p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[420px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Họ</Label>
                  <Input type="text" value={formValues.firstName} onChange={handleChange("firstName")} />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Tên</Label>
                  <Input type="text" value={formValues.lastName} onChange={handleChange("lastName")} />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Email</Label>
                  <Input type="email" value={formValues.email} onChange={handleChange("email")} />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Số điện thoại</Label>
                  <Input type="tel" value={formValues.phoneNumber} onChange={handleChange("phoneNumber")} />
                </div>
                <div className="col-span-2">
                  <Label>Chức danh</Label>
                  <Input type="text" value={formValues.jobTitle} onChange={handleChange("jobTitle")} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Huỷ
              </Button>
              <Button size="sm" onClick={handleSave}>
                Lưu
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "lg:col-span-2" : undefined}>
      <p className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  );
}
