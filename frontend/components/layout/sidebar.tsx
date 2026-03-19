"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppWindow,
  ClipboardList,
  Clock3,
  LayoutGrid,
  School,
  Settings,
  Sparkles,
  UsersRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssignmentStore } from "@/stores/assignment-store";

const primaryNavigation = [
  { label: "Home", href: "/", icon: LayoutGrid, exact: true },
  { label: "My Groups", href: "#", icon: UsersRound },
  { label: "Assignments", href: "/assignments", icon: ClipboardList },
  { label: "AI Teacher's Toolkit", href: "#", icon: AppWindow },
  { label: "My Library", href: "#", icon: Clock3 }
] as const;

const utilityNavigation = [{ label: "Settings", href: "#", icon: Settings }] as const;

const schoolProfile = {
  name: "Delhi Public School",
  subtitle: "Bokaro Steel City"
};

export const Sidebar = () => {
  const pathname = usePathname();
  const assignmentsCount = useAssignmentStore((state) => state.assignments.length);

  const isActiveItem = (item: (typeof primaryNavigation)[number] | (typeof utilityNavigation)[number]) => {
    if (item.href === "#") {
      return false;
    }

    if ("exact" in item && item.exact) {
      return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const renderNavigationItem = (
    item: (typeof primaryNavigation)[number] | (typeof utilityNavigation)[number],
    showAssignmentCount = false
  ) => {
    const Icon = item.icon;
    const isActive = isActiveItem(item);
    const shouldShowCount = showAssignmentCount && assignmentsCount > 0;

    return (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          "group flex items-center justify-between rounded-[18px] px-4 py-3 text-[15px] font-medium transition-all duration-200",
          isActive
            ? "bg-[#f1f1f1] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
            : "text-slate-500 hover:bg-[#f7f7f7] hover:text-slate-900"
        )}
      >
        <span className="flex items-center gap-3">
          <Icon
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isActive ? "text-slate-700" : "text-slate-400 group-hover:text-slate-600"
            )}
          />
          <span className="leading-none">{item.label}</span>
        </span>

        {shouldShowCount ? (
          <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-[#ff6f1f] px-2.5 py-1 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(255,111,31,0.28)]">
            {Math.min(assignmentsCount, 99)}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <>
      <aside className="hidden w-[240px] shrink-0 lg:flex">
        <div className="flex min-h-full w-full flex-col rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,247,243,0.98))] p-4 text-slate-900 shadow-[0_26px_80px_rgba(15,23,42,0.16)]">
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#f7ba55] via-[#c76717] to-[#8a1020] text-[1.65rem] font-black text-white shadow-[0_14px_30px_rgba(197,98,25,0.32)]">
              V
            </div>
            <div>
              <p className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-800">VedaAI</p>
            </div>
          </div>

          <Link
            href="/assignments/create"
            className="mt-10 block rounded-full border-[4px] border-[#f07b58] bg-gradient-to-b from-[#363636] to-[#171717] px-5 py-4 text-white shadow-[0_18px_36px_rgba(240,123,88,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(240,123,88,0.3)]"
          >
            <span className="flex items-center justify-center gap-2 text-[1.05rem] font-medium">
              <Sparkles className="h-4.5 w-4.5 fill-current" />
              Create Assignment
            </span>
          </Link>

          <nav className="mt-10 space-y-2">{primaryNavigation.map((item) => renderNavigationItem(item, item.label === "Assignments"))}</nav>

          <div className="mt-auto space-y-4 pt-8">
            <div>{utilityNavigation.map((item) => renderNavigationItem(item))}</div>

            <div className="rounded-[22px] bg-[#f2f2f2] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ffe5c1] via-[#f5a623] to-[#8f4d19] text-white shadow-[0_12px_24px_rgba(245,166,35,0.22)]">
                  <School className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold tracking-[-0.03em] text-slate-800">
                    {schoolProfile.name}
                  </p>
                  <p className="truncate text-sm text-slate-500">{schoolProfile.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-full border border-white/70 bg-white/95 px-4 py-3 text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur lg:hidden">
        {primaryNavigation.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = isActiveItem(item);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-[11px] font-medium transition",
                isActive ? "text-[#ff6f1f]" : "text-slate-500"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
};
