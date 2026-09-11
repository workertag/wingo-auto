import { useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, MoreHorizontal, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { MenuItem } from "@/config/menu";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

interface BaseLayoutProps {
  children: ReactNode;
  menuItems: MenuItem[];
}

export function BaseLayout({ children, menuItems }: BaseLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [isIncomeSheetOpen, setIsIncomeSheetOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [expandedMoreItem, setExpandedMoreItem] = useState<string | null>(null);

  // Identify primary tabs for bottom menu
  const dashboardItem = menuItems.find(
    (item) => item.id === "dashboard" || item.id === "admin-dashboard",
  );
  const teamItem = menuItems.find(
    (item) => item.id === "team" || item.id === "users",
  );
  const incomeItem = menuItems.find(
    (item) => item.id === "income" || item.id === "vaults",
  );
  const orderItem = menuItems.find(
    (item) => item.id === "order" || item.id === "withdrawals",
  );

  const primaryTabs = [dashboardItem, teamItem, incomeItem, orderItem].filter(
    (item): item is MenuItem => !!item,
  );
  const finalPrimaryTabs =
    primaryTabs.length >= 4 ? primaryTabs : menuItems.slice(0, 4);
  const primaryIds = finalPrimaryTabs.map((item) => item.id);
  const moreItems = menuItems.filter((item) => !primaryIds.includes(item.id));

  const isTabActive = (item: MenuItem) => {
    const currentPath = location.pathname;
    if (item.path) {
      return (
        currentPath === item.path || currentPath.startsWith(`${item.path}/`)
      );
    }
    if (item.children) {
      return item.children.some(
        (child) =>
          child.path &&
          (currentPath === child.path ||
            currentPath.startsWith(`${child.path}/`)),
      );
    }
    return false;
  };

  const isMoreActive = () => {
    return moreItems.some((item) => isTabActive(item));
  };

  const handlePrimaryTabClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      if (item.id === "income") {
        setIsIncomeSheetOpen(true);
      } else {
        setIsIncomeSheetOpen(true);
      }
    } else if (item.path) {
      navigate({ to: item.path, search: item.search ?? {} });
    }
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      if (item.id === "income") {
        setIsIncomeSheetOpen(true);
      } else {
        setExpandedMoreItem(expandedMoreItem === item.id ? null : item.id);
      }
    } else if (item.path) {
      navigate({ to: item.path, search: item.search ?? {} });
      setIsIncomeSheetOpen(false);
      setIsMoreSheetOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#faf8f6] overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        menuItems={menuItems}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto bg-[#faf8f6] pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden h-16 bg-white/95 backdrop-blur-md border-t border-[var(--gmc-gold)]/20 flex items-center justify-around px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[calc(4px+env(safe-area-inset-bottom,0px))]">
        {finalPrimaryTabs.map((item) => {
          const active = isTabActive(item);
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handlePrimaryTabClick(item)}
              className={`flex-1 flex flex-col items-center justify-center h-full relative py-1 transition-colors cursor-pointer ${
                active
                  ? "text-[var(--gmc-gold)]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <item.icon className="h-5 w-5 mb-0.5 transition-transform active:scale-95" />
              <span className="text-[10px] font-bold tracking-wide truncate max-w-[70px]">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          type="button"
          onClick={() => setIsMoreSheetOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center h-full relative py-1 transition-colors cursor-pointer ${
            isMoreActive()
              ? "text-[var(--gmc-gold)]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <MoreHorizontal className="h-5 w-5 mb-0.5 transition-transform active:scale-95" />
          <span className="text-[10px] font-bold tracking-wide">More</span>
          {/* {isMoreActive() && (
            <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[var(--gmc-gold)]" />
          )} */}
        </button>
      </div>

      {/* Income Bottom Sheet */}
      <div className="lg:hidden">
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close income sheet"
          onClick={() => setIsIncomeSheetOpen(false)}
          className={`fixed inset-0 bg-black/60 z-50 backdrop-blur-xs transition-opacity duration-300 cursor-default ${
            isIncomeSheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
        {/* Sheet */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 text-slate-800 rounded-t-[2rem] border-t border-[var(--gmc-gold)]/20 shadow-2xl transition-transform duration-300 ease-out max-h-[80vh] flex flex-col pb-[calc(16px+env(safe-area-inset-bottom,0px))] ${
            isIncomeSheetOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {/* Drag Indicator */}
          <div className="w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto my-3 shrink-0" />

          <div className="px-5 pb-3 border-b border-amber-100 flex items-center justify-between shrink-0">
            <h3 className="text-base font-extrabold text-slate-900">
              {incomeItem?.label || "Incomes"}
            </h3>
            <button
              type="button"
              onClick={() => setIsIncomeSheetOpen(false)}
              className="p-1 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto flex-1">
            {incomeItem?.children?.map((child) => {
              const active = isTabActive(child);
              return (
                <button
                  type="button"
                  key={child.id}
                  onClick={() => handleItemClick(child)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-md shadow-[var(--gmc-gold)]/25"
                      : "text-slate-700 hover:bg-amber-50/80 hover:text-[var(--gmc-mahogany)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <child.icon
                      className={`h-5 w-5 ${active ? "text-white" : "text-slate-500"}`}
                    />
                    <span className="text-sm font-bold">{child.label}</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* More Bottom Sheet */}
      <div className="lg:hidden">
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close more menu"
          onClick={() => setIsMoreSheetOpen(false)}
          className={`fixed inset-0 bg-black/60 z-50 backdrop-blur-xs transition-opacity duration-300 cursor-default ${
            isMoreSheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
        {/* Sheet */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 text-slate-800 rounded-t-[2rem] border-t border-[var(--gmc-gold)]/20 shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] flex flex-col pb-[calc(16px+env(safe-area-inset-bottom,0px))] ${
            isMoreSheetOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {/* Drag Indicator */}
          <div className="w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto my-3 shrink-0" />

          <div className="px-5 pb-3 border-b border-amber-100 flex items-center justify-between shrink-0">
            <h3 className="text-base font-extrabold text-slate-900">
              More Options
            </h3>
            <button
              type="button"
              onClick={() => setIsMoreSheetOpen(false)}
              className="p-1 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto flex-1">
            {moreItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMoreItem === item.id;
              const active = isTabActive(item);

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                      active && !hasChildren
                        ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-md shadow-[var(--gmc-gold)]/25"
                        : "text-slate-700 hover:bg-amber-50/80 hover:text-[var(--gmc-mahogany)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`h-5 w-5 ${active && !hasChildren ? "text-white" : "text-slate-500"}`}
                      />
                      <span className="text-sm font-bold">{item.label}</span>
                    </div>
                    {hasChildren ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-[var(--gmc-gold)]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )
                    ) : (
                      <ChevronRight
                        className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`}
                      />
                    )}
                  </button>

                  {/* Children accordion */}
                  {hasChildren && isExpanded && (
                    <div className="pl-4 mt-1 space-y-1 border-l-2 border-amber-100 ml-6">
                      {item.children?.map((child) => {
                        const childActive = isTabActive(child);
                        return (
                          <button
                            type="button"
                            key={child.id}
                            onClick={() => handleItemClick(child)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer ${
                              childActive
                                ? "text-[var(--gmc-gold-deep)] font-extrabold bg-amber-50"
                                : "text-slate-600 hover:text-[var(--gmc-mahogany)] hover:bg-amber-50/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <child.icon
                                className={`h-4 w-4 ${childActive ? "text-[var(--gmc-gold-deep)]" : "text-slate-400"}`}
                              />
                              <span className="text-xs font-bold">
                                {child.label}
                              </span>
                            </div>
                            <ChevronRight
                              className={`h-3.5 w-3.5 ${childActive ? "text-[var(--gmc-gold-deep)]" : "text-slate-300"}`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
