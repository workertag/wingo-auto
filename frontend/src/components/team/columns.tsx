import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Copy, MoveDownLeft, MoveDownRight, User } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

export type TeamMember = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  position: "left" | "right" | null;
  createdAt: string;
  blockStatus: {
    state: "blocked" | "unblocked";
    expiresAt: string | Date | null;
  } | null;
  treeStats: {
    leftCount: number;
    rightCount: number;
    leftBv: number;
    rightBv: number;
  };
};

function isEffectivelyBlocked(
  blockStatus: {
    state: "blocked" | "unblocked";
    expiresAt: string | Date | null;
  } | null,
) {
  if (!blockStatus || blockStatus.state !== "blocked") return false;
  if (!blockStatus.expiresAt) return true;
  return new Date(blockStatus.expiresAt) > new Date();
}

function CopyIdButton({ id }: { id: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(String(id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = String(id);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-mono text-xs font-bold text-slate-800">#{id}</span>
      <Button
        className="h-6 w-6 text-slate-400 hover:text-[var(--gmc-gold-deep)] transition-colors cursor-pointer"
        onClick={handleCopy}
        size="icon-sm"
        variant="ghost"
        type="button"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-600 animate-scale-in" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

function MemberCell({ member }: { member: TeamMember }) {
  const name = member.lastName
    ? `${member.firstName} ${member.lastName}`
    : member.firstName;
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-amber-50 text-[var(--gmc-gold-ochre)] border border-amber-100/50 rounded-2xl flex items-center justify-center shrink-0 shadow-3xs">
        <User className="h-4 w-4" />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-sm font-bold text-slate-900">{name}</span>
        <span className="text-[10px] sm:text-xs font-semibold text-slate-500">
          {member.email}
        </span>
      </div>
    </div>
  );
}

function formatBv(bv: number) {
  return bv.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export const teamColumns: ColumnDef<TeamMember>[] = [
  {
    accessorKey: "id",
    header: "User ID",
    cell: ({ row }) => <CopyIdButton id={row.original.id} />,
  },
  {
    accessorKey: "firstName",
    header: "Member",
    cell: ({ row }) => <MemberCell member={row.original} />,
  },
  {
    accessorKey: "position",
    header: "Leg",
    cell: ({ row }) => {
      const position = row.original.position;
      if (!position) return <span className="text-slate-300">—</span>;
      const isLeft = position === "left";
      const Icon = isLeft ? MoveDownLeft : MoveDownRight;
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isLeft
              ? "bg-sky-50 text-sky-700 border border-sky-100"
              : "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100"
          }`}
        >
          <Icon className="h-3 w-3" /> {position}
        </span>
      );
    },
  },
  {
    accessorKey: "treeStats",
    header: "Left / Right Team",
    cell: ({ row }) => {
      const stats = row.original.treeStats;
      return (
        <div className="flex items-center gap-1 text-sm font-bold whitespace-nowrap">
          <Link
            to="/team"
            search={{ userId: row.original.id }}
            className="text-emerald-600 hover:text-emerald-500 font-extrabold hover:underline transition-colors"
            title="Explore this member's team"
          >
            {stats.leftCount}
          </Link>
          <span className="text-slate-400">/</span>
          <Link
            to="/team"
            search={{ userId: row.original.id }}
            className="text-emerald-600 hover:text-emerald-500 font-extrabold hover:underline transition-colors"
            title="Explore this member's team"
          >
            {stats.rightCount}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "bv",
    header: "Left / Right BV",
    cell: ({ row }) => {
      const stats = row.original.treeStats;
      return (
        <div className="font-mono text-sm font-bold text-slate-800 whitespace-nowrap">
          {formatBv(stats.leftBv)} / {formatBv(stats.rightBv)}
        </div>
      );
    },
  },
  {
    accessorKey: "blockStatus",
    header: "Status",
    cell: ({ row }) => {
      const u = row.original;
      if (isEffectivelyBlocked(u.blockStatus)) {
        return (
          <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
            Blocked
          </span>
        );
      }
      return (
        <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
          Active
        </span>
      );
    },
  },
];
