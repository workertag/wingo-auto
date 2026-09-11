import type { ColumnDef } from "@tanstack/react-table";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { ImpersonateButton } from "@/components/admin/impersonate-button";

export type AdminUser = {
  id: number;
  roleId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  profile?: {
    id: number;
    firstName: string;
    lastName: string | null;
    email: string;
  } | null;
  evmWallet?: {
    address: string | null;
  } | null;
  referral?: {
    leftCode: string | null;
    rightCode: string | null;
  } | null;
  blockStatus: {
    state: "blocked" | "unblocked";
    expiresAt: string | Date | null;
  } | null;
  teamStats?: {
    teamCount: number | null;
    activeTeamCount: number | null;
  } | null;
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

function truncateAddress(address: string | null | undefined) {
  if (!address) return "—";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
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
    <button
      type="button"
      onClick={handleCopy}
      className="h-7 w-7 flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50/50 text-slate-400 hover:text-[var(--gmc-gold-deep)] hover:border-[var(--gmc-gold)]/40 hover:bg-amber-100/50 transition-all cursor-pointer shrink-0"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export const adminUserColumns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "id",
    header: "User ID",
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="font-mono font-black text-slate-900">#{id}</span>
          <div className="flex items-center gap-1">
            <CopyIdButton id={id} />
            <ImpersonateButton userId={id} roleId={row.original.roleId} />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "profile.firstName",
    header: "Name / Email",
    cell: ({ row }) => {
      const p = row.original.profile;
      return (
        <div className="flex flex-col">
          <span className="text-slate-800 font-bold">
            {p ? `${p.firstName}${p.lastName ? ` ${p.lastName}` : ""}` : "—"}
          </span>
          <span className="text-slate-500 text-xs font-semibold">
            {p?.email ?? "—"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "evmWallet.address",
    header: "Wallet",
    cell: ({ row }) => {
      const address = row.original.evmWallet?.address;
      return (
        <span
          className="font-mono text-xs text-slate-500 font-medium"
          title={address ?? undefined}
        >
          {truncateAddress(address)}
        </span>
      );
    },
  },
  {
    accessorKey: "referral.leftCode",
    header: "Left / Right Code",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-bold text-[var(--gmc-gold-deep)] whitespace-nowrap">
        {row.original.referral?.leftCode ?? "—"} /{" "}
        {row.original.referral?.rightCode ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "teamStats.teamCount",
    header: "Team / Active",
    cell: ({ row }) => {
      const stats = row.original.teamStats;
      return (
        <span className="font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
          {stats?.teamCount ?? 0} / {stats?.activeTeamCount ?? 0}
        </span>
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
          <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
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
