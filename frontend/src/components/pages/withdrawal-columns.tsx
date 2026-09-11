import type { WithdrawalRow } from "@api/lib/services";
import { api } from "@lib";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  Loader2,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatAmount,
  formatDate,
  formatTime,
  formatWalletAddress,
} from "@/lib/utils";

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Failed to copy");
  }
}

const IdCell = ({ id }: { id: string }) => {
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await copyToClipboard(id);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20">
          {id.slice(0, 8)}…
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-6 w-6 hover:bg-primary/10 text-primary cursor-pointer"
              onClick={handleCopy}
              size="icon"
              variant="ghost"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy ID</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "success") {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1.5">
        <CheckCircle className="h-3.5 w-3.5" />
        Success
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge
        className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1.5"
        variant="secondary"
      >
        <Clock className="h-3.5 w-3.5" />
        Pending
      </Badge>
    );
  }
  return (
    <Badge
      className="bg-rose-50 text-rose-600 border-rose-200 flex items-center gap-1.5"
      variant="secondary"
    >
      <XCircle className="h-3.5 w-3.5" />
      Rejected
    </Badge>
  );
};

const AmountCell = ({ row }: { row: { original: WithdrawalRow } }) => {
  const w = row.original;
  const gross = w.transaction?.amount;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-foreground">
        {formatAmount(w.amount)}
      </span>
      {gross !== undefined && gross !== w.amount && (
        <span className="text-xs text-muted-foreground">
          Gross: {formatAmount(gross)}
        </span>
      )}
    </div>
  );
};

const TxHashCell = ({ txHash }: { txHash: string | null }) => {
  if (!txHash) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="font-mono text-xs text-muted-foreground" title={txHash}>
      {txHash.slice(0, 8)}…{txHash.slice(-6)}
    </span>
  );
};

const DateCell = ({ date }: { date: string | null }) => {
  if (!date) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
      <div className="text-sm text-foreground">{formatDate(date)}</div>
      <div className="text-xs text-muted-foreground">{formatTime(date)}</div>
    </div>
  );
};

export const withdrawalColumns: ColumnDef<WithdrawalRow>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <IdCell id={row.original.id} />,
    size: 160,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: AmountCell,
    size: 140,
  },
  {
    accessorKey: "walletAddress",
    header: "Destination",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {formatWalletAddress(row.original.walletAddress)}
      </span>
    ),
    size: 160,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    size: 120,
  },
  {
    accessorKey: "txHash",
    header: "Tx Hash",
    cell: ({ row }) => <TxHashCell txHash={row.original.txHash} />,
    size: 160,
  },
  {
    accessorKey: "createdAt",
    header: "Requested",
    cell: ({ row }) => <DateCell date={row.getValue("createdAt")} />,
    size: 150,
  },
];

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

type MatchingTransfer = { txHash: string; amount: number; blockNumber: number };

const ApproveDialog = ({
  withdrawal,
  onSubmit,
  isPending,
}: {
  withdrawal: WithdrawalRow;
  onSubmit: (payload: { txHash: string; description: string }) => void;
  isPending: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [description, setDescription] = useState("");
  const autoFilledHashRef = useRef<string | null>(null);
  const isValid = TX_HASH_REGEX.test(txHash) && description.trim().length > 0;

  // anchors the scan to the block at the moment the dialog opens, so only
  // transfers sent after the admin started reviewing this withdrawal count
  const anchorQuery = useQuery({
    queryKey: ["withdrawal-match-anchor", withdrawal.id],
    queryFn: async () => {
      const res = await api.admin
        .withdrawals({ id: withdrawal.id })
        ["matching-transfers"].get();
      if (res.error)
        throw new Error(res.error.value?.message ?? "Failed to start scan");
      return res.data.data;
    },
    enabled: open,
  });
  const anchorBlock = anchorQuery.data?.anchorBlock;

  const matchQuery = useQuery({
    queryKey: ["withdrawal-match", withdrawal.id, anchorBlock],
    queryFn: async () => {
      const res = await api.admin
        .withdrawals({ id: withdrawal.id })
        ["matching-transfers"].get({
          query: { fromBlock: String(anchorBlock) },
        });
      if (res.error)
        throw new Error(
          res.error.value?.message ?? "Failed to scan for matching transfer",
        );
      return res.data.data;
    },
    enabled: open && anchorBlock !== undefined,
    refetchInterval: 30_000,
  });

  const matches: MatchingTransfer[] = matchQuery.data?.matches ?? [];
  const matchedHashes = new Set(matches.map((m) => m.txHash.toLowerCase()));
  const hasScanned = matchQuery.data !== undefined;
  const isScanning = anchorQuery.isFetching || matchQuery.isFetching;
  const showMismatchWarning =
    hasScanned &&
    TX_HASH_REGEX.test(txHash) &&
    !matchedHashes.has(txHash.toLowerCase());

  useEffect(() => {
    const best = matches[0];
    if (!best) return;
    // don't clobber a hash the admin manually typed themselves
    if (txHash !== "" && txHash !== autoFilledHashRef.current) return;
    if (txHash === best.txHash) return;
    setTxHash(best.txHash);
    autoFilledHashRef.current = best.txHash;
  }, [matches]);

  function resetState() {
    setTxHash("");
    setDescription("");
    autoFilledHashRef.current = null;
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
      open={open}
    >
      <Button
        className="h-7 px-2.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-600 border border-emerald-500/20"
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
      >
        Approve
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Withdrawal</DialogTitle>
          <DialogDescription>
            Confirm the on-chain payout of {formatAmount(withdrawal.amount)} to
            the address below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 p-4 bg-slate-950/40 rounded-xl border border-border">
            <div className="p-2 bg-white rounded-lg">
              <QRCode size={112} value={withdrawal.walletAddress} />
            </div>
            <button
              className="w-full flex items-center justify-between gap-2 font-mono text-xs break-all px-3 py-2 rounded-lg border border-border bg-background hover:border-emerald-500/40 transition-colors cursor-pointer"
              onClick={() => copyToClipboard(withdrawal.walletAddress)}
              type="button"
            >
              <span className="truncate text-left">
                {withdrawal.walletAddress}
              </span>
              <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-1.5">
              {isScanning && <Loader2 className="h-3 w-3 animate-spin" />}
              {isScanning
                ? "Scanning for matching transaction…"
                : hasScanned
                  ? matches.length > 0
                    ? `${matches.length} matching transfer(s) found`
                    : "No matching transfer found yet"
                  : "Waiting to scan…"}
            </span>
          </div>

          <div>
            <label
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5"
              htmlFor="approve-tx-hash"
            >
              Transaction Hash
            </label>
            <Input
              id="approve-tx-hash"
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              value={txHash}
            />
            {showMismatchWarning && (
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 mt-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                This hash wasn't found among matching on-chain transfers —
                double check it before submitting.
              </p>
            )}
          </div>
          <div>
            <label
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5"
              htmlFor="approve-note"
            >
              Note
            </label>
            <Input
              id="approve-note"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Settlement note"
              value={description}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!isValid || isPending}
            onClick={() => {
              onSubmit({ txHash, description });
              setOpen(false);
              resetState();
            }}
          >
            {isPending ? "Approving…" : "Confirm Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RejectDialog = ({
  withdrawal,
  onSubmit,
  isPending,
}: {
  withdrawal: WithdrawalRow;
  onSubmit: (payload: { description: string }) => void;
  isPending: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const isValid = description.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        className="h-7 px-2.5 text-[10px] font-black uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/25 text-rose-600 border border-rose-500/20"
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
      >
        Reject
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Withdrawal</DialogTitle>
          <DialogDescription>
            {formatAmount(withdrawal.amount)} will be refunded to the user's
            income wallet.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label
            className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5"
            htmlFor="reject-reason"
          >
            Reason
          </label>
          <Input
            id="reject-reason"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Reason for rejection"
            value={description}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={!isValid || isPending}
            variant="destructive"
            onClick={() => {
              onSubmit({ description });
              setOpen(false);
              setDescription("");
            }}
          >
            {isPending ? "Rejecting…" : "Confirm Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ActionsCell = ({ row }: { row: { original: WithdrawalRow } }) => {
  const withdrawal = row.original;
  const queryClient = useQueryClient();

  const settleMutation = useMutation({
    mutationFn: async (
      update:
        | { id: string; status: "success"; txHash: string; description: string }
        | { id: string; status: "rejected"; description: string },
    ) => {
      const res = await api.admin.withdrawals.settle.post({
        updates: [update],
      });
      if (res.error)
        throw new Error(
          res.error.value?.message ?? "Failed to settle withdrawal",
        );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Withdrawal settled successfully!");
      queryClient.invalidateQueries({ queryKey: ["withdrawals-list"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="inline-flex gap-1.5">
      {withdrawal.status === "pending" && (
        <>
          <ApproveDialog
            isPending={settleMutation.isPending}
            onSubmit={(payload) =>
              settleMutation.mutate({
                id: withdrawal.id,
                status: "success",
                ...payload,
              })
            }
            withdrawal={withdrawal}
          />
          <RejectDialog
            isPending={settleMutation.isPending}
            onSubmit={(payload) =>
              settleMutation.mutate({
                id: withdrawal.id,
                status: "rejected",
                ...payload,
              })
            }
            withdrawal={withdrawal}
          />
        </>
      )}
      <ImpersonateButton userId={withdrawal.userId} roleId={null} />
    </div>
  );
};

const UserCell = ({
  userId,
  closedBy,
}: {
  userId: number;
  closedBy: number | null;
}) => (
  <div className="flex flex-col gap-0.5 text-xs">
    <span className="text-muted-foreground">
      User: <span className="text-foreground font-medium">#{userId}</span>
    </span>
    {closedBy && (
      <span className="text-muted-foreground">
        Closed by:{" "}
        <span className="text-foreground font-medium">#{closedBy}</span>
      </span>
    )}
  </div>
);

export const adminWithdrawalColumns: ColumnDef<WithdrawalRow>[] = [
  withdrawalColumns[0] as ColumnDef<WithdrawalRow>,
  {
    id: "user",
    header: "User",
    cell: ({ row }) => (
      <UserCell closedBy={row.original.closedBy} userId={row.original.userId} />
    ),
    size: 160,
  },
  ...withdrawalColumns.slice(1),
  {
    accessorKey: "description",
    header: "Note / Reason",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.description ?? "—"}
      </span>
    ),
    size: 200,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ActionsCell,
    size: 200,
  },
];
