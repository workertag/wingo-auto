import { Bell, ChevronDown, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-transparent px-6 sm:px-8 py-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-white/50 text-slate-700 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-4" ref={dropdownRef}>
        <button className="relative p-2.5 bg-white rounded-full border border-slate-100 shadow-sm text-slate-500 hover:text-indigo-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pr-4 bg-white rounded-full border border-slate-100 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 bg-[#fde68a] rounded-full flex items-center justify-center shrink-0 text-xl overflow-hidden">
              <span>👨‍🦲</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-slate-900 leading-tight">
                Admin User
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                Administrator
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 ml-2" />
          </button>
        </div>
      </div>
    </header>
  );
}
