import { Facebook, Twitter, Linkedin, Instagram, Globe2, Camera } from "lucide-react";
import { type ChangeEvent, type ReactNode, useMemo, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import companyService from "@/services/companyService";
import { toast } from "sonner";

export default function UserMetaCard() {
  const { user, company, setCompany } = useAuthStore();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const fullName = useMemo(() => {
    const trimmedFirst = user?.firstName?.trim();
    const trimmedLast = user?.lastName?.trim();

    if (trimmedFirst && trimmedLast) {
      return `${trimmedFirst} ${trimmedLast}`;
    }

    if (trimmedLast) return trimmedLast;
    if (trimmedFirst) return trimmedFirst;
    if (company?.ceoName?.trim()) return company.ceoName.trim();
    return "HR";
  }, [user?.firstName, user?.lastName, company?.ceoName]);

  const position = user?.jobTitle ?? user?.role ?? "Quản trị viên";
  const companyName = company?.name ?? "Doanh nghiệp";
  const primaryAddress = useMemo(() => {
    const addresses = company?.addresses ?? [];

    return (
      addresses.find((address) => address?.isPrimary) ??
      addresses.find((address) =>
        Boolean(
          address?.province ||
            address?.city ||
            address?.district ||
            address?.ward ||
            address?.street ||
            address?.name
        )
      ) ??
      addresses[0] ??
      null
    );
  }, [company?.addresses]);

  // @ts-ignore
  const location = useMemo(() => {
    const parts = [
      primaryAddress?.district,
      primaryAddress?.province ?? primaryAddress?.city,
      primaryAddress?.country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : undefined;
  }, [primaryAddress?.district, primaryAddress?.province, primaryAddress?.city, primaryAddress?.country]);

  const websiteLink = company?.website ?? company?.contacts?.find((contact) => contact.type === "website")?.value;

  const socials = useMemo(() => {
    const socialContacts = company?.contacts ?? [];
    const byType = new Map(
      socialContacts
        .filter((contact) => typeof contact.type === "string" && typeof contact.value === "string")
        .map((contact) => [contact.type!.toLowerCase(), contact.value!])
    );

    const entries: Array<{ href: string; icon: ReactNode; label: string }> = [];

    const facebook = byType.get("facebook");
    if (facebook) entries.push({ href: facebook, icon: <Facebook className="h-5 w-5" />, label: "Facebook" });

    const linkedin = byType.get("linkedin");
    if (linkedin) entries.push({ href: linkedin, icon: <Linkedin className="h-5 w-5" />, label: "LinkedIn" });

    const twitter = byType.get("twitter") ?? byType.get("x");
    if (twitter) entries.push({ href: twitter, icon: <Twitter className="h-5 w-5" />, label: "X" });

    const instagram = byType.get("instagram");
    if (instagram) entries.push({ href: instagram, icon: <Instagram className="h-5 w-5" />, label: "Instagram" });

    if (websiteLink) {
      entries.push({ href: websiteLink, icon: <Globe2 className="h-5 w-5" />, label: "Website" });
    }

    return entries;
  }, [company?.contacts, websiteLink]);

  const avatarUrl = company?.avatar ?? user?.avatarUrl ?? "/images/user/owner.jpg";

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, type: "AVATAR" | "COVER") => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !company?.id) {
      return;
    }

    try {
      const uploadedUrl = await companyService.uploadCompanyImage(company.id, file, type);
      if (!uploadedUrl) {
        toast.error("Không thể tải ảnh lên");
        return;
      }

      const updated = await companyService.updateMyCompanyProfile(
        type === "AVATAR" ? { avatar: uploadedUrl } : { cover: uploadedUrl }
      );

      if (updated) {
        setCompany(updated);
      }

      toast.success(type === "AVATAR" ? "Đã cập nhật ảnh đại diện" : "Đã cập nhật ảnh bìa");
    } catch (error) {
      toast.error("Tải ảnh thất bại");
      console.error(error);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:p-6">
      <input
        ref={avatarInputRef}
        type="file"
        title="Chọn ảnh đại diện"
        className="hidden"
        accept="image/*"
        onChange={(event) => handleUpload(event, "AVATAR")}
      />
      <input
        ref={coverInputRef}
        type="file"
        title="Chọn ảnh bìa"
        className="hidden"
        accept="image/*"
        onChange={(event) => handleUpload(event, "COVER")}
      />

      <div className="mb-4 h-28 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
        {company?.cover ? (
          <img src={company.cover} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700" />
        )}
      </div>

      <div className="flex flex-col items-center gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col items-center gap-6 xl:flex-row">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-gray-200 shadow-sm dark:border-gray-700">
            <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full border border-gray-200 bg-white p-1 text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              aria-label="Đổi ảnh đại diện"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-center xl:text-left">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{fullName}</h4>
            <div className="mt-2 flex flex-col items-center gap-1 text-sm text-gray-500 dark:text-gray-400 xl:flex-row xl:items-center xl:gap-3">
              <span>{position}</span>
              <span className="hidden h-3.5 w-px bg-gray-200 dark:bg-gray-700 xl:block" aria-hidden="true" />
              <span>{companyName}</span>
              {/* {location && (
                <>
                  <span className="hidden h-3.5 w-px bg-gray-200 dark:bg-gray-700 xl:block" aria-hidden="true" />
                  <span>{location}</span>
                </>
              )} */}
            </div>
            {(user?.email || company?.email) && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{user?.email ?? company?.email}</p>
            )}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="mt-2 text-xs font-medium text-brand-600 hover:underline"
            >
              Đổi ảnh bìa
            </button>
          </div>

            {socials.length > 0 && (
            <div className="flex items-center gap-2 xl:ml-auto xl:pl-4">
              {socials.map((item) => (
                <SocialIcon key={item.label} href={item.href} icon={item.icon} label={item.label} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialIcon({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs transition-transform hover:scale-105 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-100"
    >
      {icon}
    </a>
  );
}
