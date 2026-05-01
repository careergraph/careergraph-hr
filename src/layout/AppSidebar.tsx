import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import useThreads from "@/features/messaging/hooks/useThreads";

// Assume these icons are imported from an icon library
import {
  CalenderIcon,
  ChatIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  TableIcon,
  UserCircleIcon,
  VideoIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  // {
  //   name: "Kanban",
  //   icon: <ListIcon />,
  //   path: "/kanbans",
  // },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
  },
  // {
  //   icon: <UserCircleIcon />,
  //   name: "Employees",
  //   path: "/employees",
  // },
  {
    icon: <UserCircleIcon />,
    name: "Candidates",
    path: "/candidates",
  },
  {
    icon: <ChatIcon />,
    name: "Tin nhắn",
    path: "/messages",
  },
  {
    name: "Jobs",
    icon: <TableIcon />,
    // subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
    path: "/jobs",
  },
  {
    icon: <HorizontaLDots />,
    name: "Pipeline",
    path: "/kanbans/pipeline",
  },
  {
    icon: <VideoIcon />,
    name: "Phỏng vấn",
    path: "/interviews",
  },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    isMobile,
    isTablet,
    toggleMobileSidebar,
  } = useSidebar();
  const location = useLocation();
  const { totalUnread } = useThreads({ autoLoad: true, archived: false });

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const sidebarWidth = useMemo(() => {
    if (isMobile) return 'w-[290px]';
    if (isTablet) return 'w-16';
    return isExpanded || isHovered ? 'w-[290px]' : 'w-[100px]';
  }, [isMobile, isTablet, isExpanded, isHovered]);

  const showLabels = isMobile ? isMobileOpen : isTablet ? false : (isExpanded || isHovered);

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !showLabels
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
              title={isTablet ? nav.name : undefined}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {showLabels && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {showLabels && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                } ${isTablet ? "justify-center" : ""}`}
                title={isTablet ? nav.name : undefined}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {showLabels && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {nav.path === "/messages" && totalUnread > 0 ? (
                  isTablet ? (
                    <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                  ) : (
                    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  )
                ) : null}
              </Link>
            )
          )}
          {nav.subItems && showLabels && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Overlay for mobile sidebar */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => {
            toggleMobileSidebar();
            setIsHovered(false);
          }}
        />
      )}
      <aside
        className={`fixed top-0 left-0 flex flex-col h-full bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 dark:text-gray-100 transition-[width,transform] duration-500 ease-in-out z-50 border-r border-gray-200
          ${sidebarWidth}
          ${isMobile ? (isMobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
          ${isTablet ? "px-2" : "px-4 sm:px-5"} mt-0`}
        onMouseEnter={() => {
          if (!isExpanded && !isMobileOpen && !isTablet) {
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (!isExpanded && !isMobileOpen && !isTablet) {
            setIsHovered(false);
          }
        }}
      >
        <div className={`flex items-center ${isTablet ? "justify-center" : "gap-3"} py-6`}>
          <Link to="/" className="flex items-center">
            <img
              className="w-10 h-10"
              src="/images/logo/logo.svg"
              alt="Logo"
              width={40}
              height={40}
            />
            {showLabels && (
              <div className="bg-gradient-to-r text-xl font-semibold from-[#583DF2] to-[#F3359D] bg-clip-text text-transparent ml-2">
                CareerGraph
              </div>
            )}

          </Link>
        </div>
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
          <nav className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !showLabels
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {showLabels ? (
                    "Menu"
                  ) : isTablet ? (
                    <hr className="w-full border-gray-200 dark:border-gray-700" />
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(navItems, "main")}
              </div>
              {othersItems.length > 0 && (
                <div className="">
                  <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                      !showLabels
                        ? "lg:justify-center"
                        : "justify-start"
                    }`}
                  >
                    {showLabels ? (
                      "Others"
                    ) : isTablet ? (
                      <hr className="w-full border-gray-200 dark:border-gray-700" />
                    ) : (
                      <HorizontaLDots />
                    )}
                  </h2>
                  {renderMenuItems(othersItems, "others")}
                </div>
              )}
            </div>
          </nav>
          {showLabels ? <SidebarWidget /> : null}
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
