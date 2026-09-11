import type { TransactionRow } from "@api/lib/services";
import type { Transaction } from "@api/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Copy,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAmount, formatDate, formatTime } from "@/lib/utils";

const IdCell = ({ row }: { row: { original: TransactionRow } }) => {
  const tx = row.original;

  const copyToClipboard = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(tx.id);
      toast.success(`Copied: ${tx.id}`);
    } catch {
      const area = document.createElement("textarea");
      area.value = tx.id;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
      toast.success(`Copied: ${tx.id}`);
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs bg-amber-50 text-[var(--gmc-gold-deep)] px-2 py-1 rounded-md border border-amber-100/60 font-bold">
          {tx.id.slice(0, 8)}…
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-6 w-6 hover:bg-amber-50 hover:text-[var(--gmc-gold-deep)] text-slate-450 cursor-pointer"
              onClick={copyToClipboard}
              size="icon"
              variant="ghost"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy Transaction ID</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "completed") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-250/50 flex items-center gap-1.5 font-bold shadow-2xs">
        <CheckCircle className="h-3.5 w-3.5" />
        Completed
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge
        className="bg-amber-50/85 text-[var(--gmc-gold-deep)] border-amber-150/50 flex items-center gap-1.5 font-bold shadow-2xs"
        variant="secondary"
      >
        <Clock className="h-3.5 w-3.5" />
        Pending
      </Badge>
    );
  }
  if (status === "cancelled") {
    return (
      <Badge
        className="bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1.5 font-bold shadow-2xs"
        variant="secondary"
      >
        <XCircle className="h-3.5 w-3.5" />
        Cancelled
      </Badge>
    );
  }
  return (
    <Badge
      className="bg-rose-50 text-rose-700 border-rose-250/50 flex items-center gap-1.5 font-bold shadow-2xs"
      variant="secondary"
    >
      <XCircle className="h-3.5 w-3.5" />
      Failed
    </Badge>
  );
};

const typeColorMap: Record<Transaction["type"], string> = {
  invest: "orange",
  retopup: "amber",
  auto_upgrade: "yellow",
  transfer: "indigo",
  swap: "sky",
  level_income: "violet",
  booster_income: "fuchsia",
  direct_income: "emerald",
  retopup_bonus_income: "teal",
  rank_achievement_income: "pink",
  profit_sharing_income: "purple",
  withdrawal: "rose",
  admin_adjustment: "amber",
  deposit: "cyan",
  sponsor_commission: "emerald",
  matching_bonus: "violet",
  auto_pool_entry: "orange",
  auto_pool_burn_entry: "red",
  auto_pool_income_reward: "emerald",
  auto_pool_upgrade_reward: "amber",
  exclusive_pool_entry: "orange",
  exclusive_pool_income_reward: "emerald",
  exclusive_pool_upgrade_reward: "amber",
};

const TypeBadge = ({ type }: { type: Transaction["type"] }) => {
  const color = typeColorMap[type] ?? "gray";
  const label = type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge
      className={`bg-${color}-50 text-${color}-700 border-${color}-200 font-extrabold`}
      variant="outline"
    >
      {label}
    </Badge>
  );
};

const AmountCell = ({
  amount,
  netAmount,
  metadata,
}: {
  amount: number;
  netAmount: number;
  metadata?: Record<string, unknown> | null;
}) => {
  const isGnx = metadata?.currency === "GNX";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono font-extrabold text-slate-800">
        {isGnx
          ? `${(netAmount / 100).toLocaleString(undefined, { maximumFractionDigits: 4 })} GNX`
          : formatAmount(netAmount)}
      </span>
      {amount !== netAmount && (
        <span className="font-mono text-xs text-slate-400 font-bold line-through">
          {isGnx
            ? `${(amount / 100).toLocaleString(undefined, { maximumFractionDigits: 4 })} GNX`
            : formatAmount(amount)}
        </span>
      )}
    </div>
  );
};

const WalletCell = ({
  fromWallet,
  toWallet,
}: {
  fromWallet: string | null;
  toWallet: string | null;
}) => {
  const fmt = (w: string | null) =>
    w ? w.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600">
      {fromWallet && (
        <div className="flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3 text-rose-500" />
          <span className="text-slate-500">{fmt(fromWallet)}</span>
        </div>
      )}
      {fromWallet && toWallet && (
        <span className="text-slate-300 font-medium">&rarr;</span>
      )}
      {toWallet && (
        <div className="flex items-center gap-1">
          <ArrowDownLeft className="h-3 w-3 text-green-500" />
          <span className="text-slate-500">{fmt(toWallet)}</span>
        </div>
      )}
    </div>
  );
};

const DescriptionCell = ({ description }: { description: string | null }) => {
  const [expanded, setExpanded] = useState(false);
  const text = description ?? "—";
  const shouldTruncate = text.length > 30;

  return (
    <span
      role="tab"
      tabIndex={-1}
      className={`text-xs sm:text-sm text-slate-500 font-medium ${shouldTruncate ? "cursor-pointer underline hover:text-[var(--gmc-gold-deep)] transition-colors" : ""}`}
      onClick={() => shouldTruncate && setExpanded(!expanded)}
      onKeyDown={() => shouldTruncate && setExpanded(!expanded)}
    >
      {expanded || !shouldTruncate ? text : `${text.slice(0, 30)}…`}
    </span>
  );
};

const DateCell = ({ date }: { date: string }) => (
  <div className="bg-amber-50/30 px-2.5 py-1 rounded-xl border border-amber-100/60 text-left w-fit shadow-3xs">
    <div className="text-xs sm:text-sm font-bold text-slate-800">
      {formatDate(date)}
    </div>
    <div className="text-[10px] text-slate-400 font-bold">
      {formatTime(date)}
    </div>
  </div>
);

const UserCell = ({ row }: { row: { original: TransactionRow } }) => {
  const tx = row.original;
  const formatUser = (
    user: TransactionRow["fromUser"] | TransactionRow["toUser"],
  ) => {
    if (!user) return null;
    const name = [user.profile?.firstName, user.profile?.lastName]
      .filter(Boolean)
      .join(" ");
    return name ? `${name} (#${user.id})` : `#${user.id}`;
  };

  const from = formatUser(tx.fromUser);
  const to = formatUser(tx.toUser);

  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {from && (
        <span className="text-slate-500 font-medium">
          From: <span className="text-slate-800 font-bold">{from}</span>
        </span>
      )}
      {to && (
        <span className="text-slate-500 font-medium">
          To: <span className="text-slate-800 font-bold">{to}</span>
        </span>
      )}
      {!from && !to && <span className="text-slate-400 font-semibold">—</span>}
    </div>
  );
};

export const transactionColumns: ColumnDef<TransactionRow>[] = [
  {
    accessorKey: "id",
    header: "Transaction ID",
    cell: IdCell,
    size: 180,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <TypeBadge type={row.getValue("type")} />,
    size: 160,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    size: 130,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <AmountCell
        amount={row.original.amount}
        netAmount={row.original.netAmount}
        metadata={row.original.metadata as Record<string, unknown> | null}
      />
    ),
    size: 120,
  },
  {
    accessorKey: "fromWalletType",
    header: "Wallet Flow",
    cell: ({ row }) => (
      <WalletCell
        fromWallet={row.original.fromWalletType}
        toWallet={row.original.toWalletType}
      />
    ),
    size: 200,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <DescriptionCell description={row.original.description} />
    ),
    size: 200,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <DateCell date={row.getValue("createdAt")} />,
    size: 180,
  },
];

const ActionsCell = ({ row }: { row: { original: TransactionRow } }) => {
  const tx = row.original;
  // Prefer the recipient (the account whose balance actually changed) but
  // fall back to the sender for outbound-only transactions (withdrawals).
  const target = tx.toUser ?? tx.fromUser;
  if (!target) return null;
  return <ImpersonateButton userId={target.id} roleId={target.roleId} />;
};

export const adminTransactionColumns: ColumnDef<TransactionRow>[] = [
  transactionColumns[0] as ColumnDef<TransactionRow>,
  {
    id: "users",
    header: "Users",
    cell: UserCell,
    size: 200,
  },
  ...transactionColumns.slice(1),
  {
    id: "actions",
    header: "Actions",
    cell: ActionsCell,
    size: 100,
  },
];
