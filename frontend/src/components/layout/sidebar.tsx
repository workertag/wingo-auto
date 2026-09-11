import { useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Menu, X } from "lucide-react";
import type { MenuItem } from "@/config/menu";
import {
  useSidebarActions,
  useSidebarCollapsed,
  useSidebarExpandedItem,
} from "@/stores/ui-store";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

export function Sidebar({ isOpen, onClose, menuItems }: SidebarProps) {
  const isCollapsed = useSidebarCollapsed();
  const expandedItem = useSidebarExpandedItem();
  const { toggleSidebarCollapse, setSidebarExpandedItem } = useSidebarActions();
  const logoHref = "/";

  return (
    <>
      {isOpen && (
        <button
          type="button"
          tabIndex={-1}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity w-full h-full border-none cursor-default"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${isCollapsed ? "w-20" : "w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          bg-white text-slate-700 border-r border-slate-100
          transition-all duration-300 ease-in-out
          flex flex-col shadow-sm
        `}
      >
        {/* Sidebar Header */}
        <div
          className={`flex items-center p-6 border-b border-slate-100/50 ${
            isCollapsed ? "justify-center" : "justify-between gap-3"
          }`}
        >
          {!isCollapsed ? (
            <a href={logoHref} className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 transition-transform duration-500 group-hover:scale-110">
                {/* Custom CSS Logo 'W' matching the mockup */}
                <div className="absolute w-6 h-6 rounded-full bg-indigo-500 opacity-80 mix-blend-multiply translate-x-[-4px] translate-y-[2px]" />
                <div className="absolute w-6 h-6 rounded-full bg-violet-400 opacity-80 mix-blend-multiply translate-x-[4px] translate-y-[-2px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  WinGo
                </span>
                <span className="text-[10px] font-semibold text-slate-400 leading-none mt-1">
                  Math Engine
                </span>
              </div>
            </a>
          ) : (
            <a
              href={logoHref}
              className="relative w-8 h-8 flex-shrink-0 block p-0.5"
            >
              <img
                src="/gmc-icon.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/gmc.webp";
                }}
              />
            </a>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="p-1.5 hover:bg-slate-50 hover:text-indigo-600 text-slate-400 rounded-lg transition-colors hidden lg:block cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-50 hover:text-indigo-600 text-slate-400 rounded-lg transition-colors lg:hidden cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              expandedItem={expandedItem}
              setExpandedItem={setSidebarExpandedItem}
              onNavigate={onClose}
            />
          ))}
        </nav>

        {!isCollapsed && <UserInfo />}
      </aside>
    </>
  );
}

interface SidebarItemProps {
  item: MenuItem;
  isCollapsed: boolean;
  expandedItem: string | null;
  setExpandedItem: (id: string | null) => void;
  onNavigate: () => void;
  depth?: number;
}

function SidebarItem({
  item,
  isCollapsed,
  expandedItem,
  setExpandedItem,
  onNavigate,
  depth = 0,
}: SidebarItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItem === item.id;
  const isActive = item.path
    ? location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`)
    : false;

  const handleClick = () => {
    if (hasChildren) {
      setExpandedItem(isExpanded ? null : item.id);
    }
    if (item.path) {
      navigate({ to: item.path, search: item.search ?? {} });
      onNavigate();
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer
          transition-all duration-200 text-sm font-semibold tracking-wide
          ${
            isActive
              ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30"
              : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
          }
          ${depth > 0 ? "ml-3 pl-2" : ""}
        `}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon
          className={`shrink-0 h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-500"}`}
        />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {hasChildren && (
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            )}
          </>
        )}
      </button>

      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-1 pl-2">
          {item.children?.map((child) => (
            <SidebarItem
              key={child.id}
              item={child}
              isCollapsed={isCollapsed}
              expandedItem={expandedItem}
              setExpandedItem={setExpandedItem}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserInfo() {
  const name = "Admin User";
  
  return (
    <div className="p-4 border-t border-slate-100 bg-white">
      <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 border border-slate-100 transition-colors hover:border-indigo-100 cursor-pointer">
        <div className="w-10 h-10 bg-[#fde68a] rounded-xl flex items-center justify-center shrink-0 text-xl overflow-hidden">
          {/* Avatar matching mockup */}
          <span>👨‍🦲</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate leading-tight">
            {name}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">
            Administrator
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
}
