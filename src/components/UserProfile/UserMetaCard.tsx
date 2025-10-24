import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function UserMetaCard() {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center ju w-full gap-6 xl:flex-row">
          {/* Avatar */}
          <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
            <img src="/images/user/owner.jpg" alt="user" />
          </div>

          {/* Info */}
          <div>
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              Musharof Chowdhury
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Team Manager
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Arizona, United States
              </p>
            </div>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-2 xl:ml-auto xl:pr-1">
            <SocialIcon
              href="https://www.facebook.com/PimjoHQ"
              icon={<Facebook className="h-5 w-5" />}
            />
            <SocialIcon
              href="https://x.com/PimjoHQ"
              icon={<Twitter className="h-5 w-5" />}
            />
            <SocialIcon
              href="https://www.linkedin.com/company/pimjo"
              icon={<Linkedin className="h-5 w-5" />}
            />
            <SocialIcon
              href="https://instagram.com/PimjoHQ"
              icon={<Instagram className="h-5 w-5" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Component con tái sử dụng */
function SocialIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 transition-transform hover:scale-105"
    >
      {icon}
    </a>
  );
}
