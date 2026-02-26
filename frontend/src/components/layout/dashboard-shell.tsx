"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Shield } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/evaluations": "Evaluations",
  "/evaluate": "Run Evaluation",
  "/knowledge-base": "Knowledge Base",
};

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return title;
    }
  }
  return "Dashboard";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-background px-6">
          <div className="flex items-center gap-3">
            {/* Mobile logo (visible on small screens only) */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm md:hidden">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {pageTitle}
              </h2>
              <p className="text-xs text-muted-foreground">
                Evaluation Pipeline
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
