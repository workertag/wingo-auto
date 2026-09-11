import { api } from "@lib";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowLeft,
  ListTree,
  Loader2,
  Network,
  Users,
} from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Route } from "@/routes/_user/team";
import { teamColumns } from "./columns";
import TreeView from "./tree-view";
import {FaRegHandPointLeft, FaRegHandPointRight } from "react-icons/fa";

function TreeStatsHeader() {
  const { user } = useAuth();
  const stats = user?.treeStats;
  if (!stats) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-3 mb-6">
      <div className="p-4 rounded-2xl bg-green-50/60 border border-green-400 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white text-green-600 border border-green-400 flex items-center justify-center shrink-0">
          <FaRegHandPointLeft className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-black text-green-600 uppercase tracking-widest">
            Left Leg
          </div>
          <div className="text-sm font-extrabold text-slate-800">
            {stats.leftCount} members · {stats.leftBv} BV
          </div>
        </div>
      </div>
      <div className="p-4 rounded-2xl bg-orange-900/10 border border-orange-900 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white text-orange-900 border border-orange-900 flex items-center justify-center shrink-0">
          <FaRegHandPointRight className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-black text-orange-800 uppercase tracking-widest">
            Right Leg
          </div>
          <div className="text-sm font-extrabold text-slate-800">
            {stats.rightCount} members · {stats.rightBv} BV
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { userId } = Route.useSearch();
  const location = useLocation();
  const searchParams = new URLSearchParams(
    location.search as Record<string, string>,
  );
  const page = Number(searchParams.get("page")) || 1;
  const size = Number(searchParams.get("size")) || 15;
  const [view, setView] = useState<"tree" | "list">("tree");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["team-list", userId, page, size],
    queryFn: async () => {
      const { data } = await api.users.team.get({
        query: {
          page,
          size,
          ...(userId !== undefined ? { userId } : {}),
        },
      });
      if (!data?.data) throw new Error("Failed to fetch team data.");
      return data.data;
    },
    enabled: view === "list",
  });

  const title = userId ? `Team of User #${userId}` : "My Team";
  const description = userId
    ? `Members directly referred by User #${userId}`
    : "Your binary tree left and right leg placements";

  return (
    <div className="min-h-screen bg-[#faf8f6] text-slate-800">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-left">
          {userId && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-3 -ml-2 text-slate-500 hover:text-[var(--gmc-gold-deep)] hover:bg-amber-50/50 rounded-lg transition-colors cursor-pointer"
              asChild
            >
              <Link to="/team" search={{}}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to my team
              </Link>
            </Button>
          )}
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-50 text-[var(--gmc-gold-deep)] border border-amber-300 flex items-center justify-center shadow-3xs">
              <Users className="h-8 w-8 sm:h-9 sm:w-9" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">
                {title}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-none">
                {description}
              </p>
            </div>
          </div>
        </div>

        {!userId && <TreeStatsHeader />}

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={view === "tree" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("tree")}
            className={`rounded-xl cursor-pointer ${view === "tree" ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white" : "border-amber-200 text-slate-600"}`}
          >
            <Network className="h-4 w-4 mr-1.5" /> Tree View
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className={`rounded-xl cursor-pointer ${view === "list" ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white" : "border-amber-200 text-slate-600"}`}
          >
            <ListTree className="h-4 w-4 mr-1.5" /> List View
          </Button>
        </div>

        {view === "tree" ? (
          <TreeView rootId={userId} />
        ) : (
          <div className="bg-white/95 backdrop-blur-md border border-amber-200/40 rounded-3xl shadow-sm p-4 md:p-6 lg:p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-[var(--gmc-gold)] mb-4" />
                <p className="text-slate-500 font-bold text-sm">
                  Loading team...
                </p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-750 border border-rose-100 flex items-center justify-center mb-4 shadow-3xs">
                  <span className="text-rose-600 text-2xl font-black">!</span>
                </div>
                <p className="text-slate-900 font-extrabold mb-2">
                  Something went wrong
                </p>
                <p className="text-xs text-slate-500 font-semibold mb-4">
                  {error instanceof Error
                    ? error.message
                    : "Could not load team data."}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-amber-200 text-[var(--gmc-gold-deep)] hover:bg-amber-50 cursor-pointer"
                >
                  Try again
                </Button>
              </div>
            ) : (
              <DataTable
                columns={teamColumns}
                data={data}
                serverSide
                sortableColumns={["id", "createdAt"]}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
