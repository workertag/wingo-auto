import { api } from "@lib";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { DataTable } from "@/components/tables/data-table";
import { adminUserColumns } from "./columns";

export function AdminUsersPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(
    location.search as Record<string, string>,
  );
  const page = Number(searchParams.get("page")) || 1;
  const size = Number(searchParams.get("size")) || 15;
  const search = searchParams.get("search") || undefined;

  const { data } = useQuery({
    queryKey: ["admin-users-list", page, size, search],
    queryFn: async () => {
      const res = await api.admin.users.list.get({
        query: {
          page,
          size,
          search: search || undefined,
        },
      });
      return res.data?.data ?? null;
    },
  });

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800 selection:bg-[var(--gmc-gold)]/20 selection:text-[var(--gmc-gold-deep)] text-left">
      {/* Global ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/40 via-amber-50/50 to-transparent blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10 animate-fade-in-up">
        {/* Simple Interactive Admin Header */}
        {/* NATIVE MOBILE LAYOUT */}
        <div className="sm:hidden flex items-center justify-between p-4 rounded-3xl bg-white/95 border border-amber-200/40 shadow-md shadow-amber-950/5 text-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-100/60 to-amber-100/80 border border-amber-300 shadow-2xs flex items-center justify-center">
              <Users className="w-6 h-6 text-[var(--gmc-gold)]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Admin Area
              </p>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                All Users
              </h2>
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden sm:block relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/85 p-6 shadow-md shadow-amber-950/5 text-slate-800">
          {/* Background radial glow */}
          <div className="absolute top-1/2 left-1/4 w-[350px] h-[150px] bg-amber-100/50 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4.5">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-50 via-orange-100/50 to-amber-200 border border-amber-300 shadow-md">
                <Users className="w-8 h-8 text-[var(--gmc-gold)]" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  All Users
                </h1>
                <p className="text-xs text-slate-600 font-semibold max-w-xl leading-normal">
                  Inspect user profile details, referral stats, and verify
                  access levels.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Operations Card */}
        <div className="bg-white/95 backdrop-blur-md border border-amber-200/40 rounded-3xl shadow-sm p-4 md:p-6 lg:p-8">
          <DataTable
            columns={adminUserColumns}
            data={data ?? undefined}
            serverSide
            sortableColumns={["id"]}
            showSerialNumber={false}
          />
        </div>
      </div>
    </div>
  );
}
