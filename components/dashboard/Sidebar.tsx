"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SidebarItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

interface SidebarProps {
  items: SidebarItem[];
}

const COLLAPSED_WIDTH = "w-16 xl:w-20";
const EXPANDED_WIDTH = "w-[220px] xl:w-[260px]";

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items.length) {
    return null;
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-100 z-40 border-r border-gray-200 transition-[width] duration-300 ease-out overflow-hidden",
        isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav aria-label="Dashboard navigation" className="h-full p-4">
        <ul className="space-y-3">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/dashboard/teacher" &&
                item.href !== "/dashboard/student" &&
                pathname.startsWith(item.href + "/"));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                    isExpanded ? "gap-3 justify-start" : "gap-0 justify-center",
                    isActive
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                      : "text-gray-600 hover:text-blue-700 hover:bg-blue-100"
                  )}
                >
                  {item.icon && (
                    <span className="w-5 h-5 flex-shrink-0 text-inherit">{item.icon}</span>
                  )}
                  <span
                    className={cn(
                      "whitespace-nowrap transition-all duration-200",
                      isExpanded ? "opacity-100 max-w-[160px] ml-2" : "opacity-0 max-w-0"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

