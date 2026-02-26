"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  Play,
  BookOpen,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Evaluations",
    href: "/evaluations",
    icon: ClipboardList,
  },
  {
    label: "Run Evaluation",
    href: "/evaluate",
    icon: Play,
  },
  {
    label: "Knowledge Base",
    href: "/knowledge-base",
    icon: BookOpen,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-border/40 bg-background">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-foreground">
            Syd Life AI
          </h1>
          <p className="text-[11px] font-medium text-muted-foreground">
            Evaluation Pipeline
          </p>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-4 h-px bg-border/60" />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/25"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 h-4.5 w-4.5",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="relative z-10">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/40 px-4 py-4">
        <p className="text-[11px] text-muted-foreground/60">
          v1.0.0 &middot; LLM Eval Pipeline
        </p>
      </div>
    </aside>
  );
}
