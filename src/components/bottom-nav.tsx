"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAutoSync } from "@/hooks/use-auto-sync";

const tabs = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/sync", label: "Sync", icon: "⟳" },
  { href: "/stats", label: "Stats", icon: "▦" },
  { href: "/simulate", label: "Simulate", icon: "⎆" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { hasNew } = useAutoSync();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-800 z-50">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const showDot = tab.href === "/sync" && hasNew;
          return (
            <Link key={tab.href} href={tab.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${isActive ? "text-accent" : "text-gray-600"}`}>
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              {showDot && (
                <span className="absolute top-0 right-1 w-2 h-2 bg-accent rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
