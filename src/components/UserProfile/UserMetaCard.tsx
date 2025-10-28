import { Facebook, Twitter, Linkedin, Instagram, Globe2 } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";

export default function UserMetaCard() {
  const { user, company } = useAuthStore();

  const fullName = useMemo(() => {
    const trimmedFirst = user?.firstName?.trim();
    const trimmedLast = user?.lastName?.trim();

    if (trimmedFirst && trimmedLast) {
      return `${trimmedFirst} ${trimmedLast}`;
    }

    if (trimmedLast) return trimmedLast;
    if (trimmedFirst) return trimmedFirst;
    return "HR";
  }, [user?.firstName, user?.lastName]);

  const position = user?.jobTitle ?? user?.role ?? "Quản trị viên";
  const companyName = company?.name ?? "Doanh nghiệp";
  const location = useMemo(() => {
    const address = company?.addresses?.[0];
    const parts = [address?.city, address?.district, address?.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : undefined;
  }, [company?.addresses]);

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

  const avatarUrl = user?.avatarUrl ?? "/images/user/owner.jpg";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:p-6">
      <div className="flex flex-col items-center gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col items-center gap-6 xl:flex-row">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 shadow-sm dark:border-gray-700">
            <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
          </div>

          <div className="text-center xl:text-left">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{fullName}</h4>
            <div className="mt-2 flex flex-col items-center gap-1 text-sm text-gray-500 dark:text-gray-400 xl:flex-row xl:items-center xl:gap-3">
              <span>{position}</span>
              <span className="hidden h-3.5 w-px bg-gray-200 dark:bg-gray-700 xl:block" aria-hidden="true" />
              <span>{companyName}</span>
              {location && (
                <>
                  <span className="hidden h-3.5 w-px bg-gray-200 dark:bg-gray-700 xl:block" aria-hidden="true" />
                  <span>{location}</span>
                </>
              )}
            </div>
            {user?.email && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
            )}
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
      className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs transition-transform hover:scale-105 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.05] dark:hover:text-gray-100"
    >
      {icon}
    </a>
  );
}
