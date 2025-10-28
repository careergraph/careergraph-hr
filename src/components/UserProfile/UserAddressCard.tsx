import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { Modal } from "@/components/custom/modal";
import Button from "@/components/custom/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useAuthStore } from "@/stores/authStore";

export default function UserAddressCard() {
  const { company } = useAuthStore();
  const { isOpen, openModal, closeModal } = useModal();

  const primaryAddress = useMemo(() => company?.addresses?.[0] ?? null, [company?.addresses]);

  const [addressForm, setAddressForm] = useState({
    country: primaryAddress?.country ?? "Việt Nam",
    city: primaryAddress?.city ?? "",
    district: primaryAddress?.district ?? "",
    street: primaryAddress?.street ?? "",
  
  });

  useEffect(() => {
    setAddressForm({
      country: primaryAddress?.country ?? "Việt Nam",
      city: primaryAddress?.city ?? "",
      district: primaryAddress?.district ?? "",
      street: primaryAddress?.street ?? "",
    
    });
  }, [
    primaryAddress?.country,
    primaryAddress?.city,
    primaryAddress?.district,
    primaryAddress?.street,
  ]);

  const handleChange = (field: keyof typeof addressForm) => (event: ChangeEvent<HTMLInputElement>) => {
    setAddressForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = () => {
    closeModal();
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 lg:mb-6">Địa chỉ doanh nghiệp</h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <InfoCell label="Quốc gia" value={primaryAddress?.country ?? "Chưa cập nhật"} />
              <InfoCell label="Tỉnh/Thành phố" value={primaryAddress?.city ?? "Chưa cập nhật"} />
              <InfoCell label="Quận/Huyện" value={primaryAddress?.district ?? "Chưa cập nhật"} />
              <InfoCell label="Địa chỉ cụ thể" value={primaryAddress?.street ?? "Chưa cập nhật"} fullWidth />
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
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[700px]">
        <div className="custom-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-10">
            <h4 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">Cập nhật địa chỉ</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Điều chỉnh thông tin giúp ứng viên dễ dàng tìm đến văn phòng của bạn.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-2 lg:grid-cols-2">
              <div>
                <Label>Quốc gia</Label>
                <Input type="text" value={addressForm.country} onChange={handleChange("country")} />
              </div>
              <div>
                <Label>Tỉnh/Thành phố</Label>
                <Input type="text" value={addressForm.city} onChange={handleChange("city")} />
              </div>
              <div>
                <Label>Quận/Huyện</Label>
                <Input type="text" value={addressForm.district} onChange={handleChange("district")} />
              </div>
              <div className="lg:col-span-2">
                <Label>Địa chỉ cụ thể</Label>
                <Input type="text" value={addressForm.street} onChange={handleChange("street")} />
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
    </>
  );
}

function InfoCell({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "lg:col-span-2" : undefined}>
      <p className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  );
}
