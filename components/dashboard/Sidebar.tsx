"use client";

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

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  if (!items.length) {
    return null;
  }

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[220px] xl:w-[260px] bg-gray-100 z-40 border-r border-gray-200" >
    
      <nav
        aria-label="Dashboard navigation"
        className="h-full p-4"
      >
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
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                    isActive
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                      : "text-gray-600 hover:text-blue-700 hover:bg-blue-100"
                  )}
                >
                  {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

