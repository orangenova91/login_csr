"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SidebarItem = {
  href: string;
  label: string;
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
    <aside className="w-full max-w-[220px] xl:max-w-[260px] shrink-0">
      <nav
        aria-label="Dashboard navigation"
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-24"
      >
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/60"
                  )}
                >
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

