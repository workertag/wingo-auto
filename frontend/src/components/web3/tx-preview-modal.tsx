import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

export interface TxPreviewRow {
  label: string;
  value: string;
}

interface TxPreviewModalProps {
  title: string;
  description?: string;
  rows: TxPreviewRow[];
  status: "checking" | "ready" | "error";
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Shows exactly what an upcoming contract call will do before the wallet
 * signing prompt appears. The caller simulates the call first (an eth_call,
 * no gas spent) — if it would revert, we surface that here instead of
 * letting the user pay gas for a doomed transaction.
 */
export function TxPreviewModal({
  title,
  description,
  rows,
  status,
  error,
  onConfirm,
  onCancel,
}: TxPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close preview"
        onClick={onCancel}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-default border-none"
      />
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-amber-200/80 shadow-2xl p-6 space-y-5 animate-fade-in-up">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/30 divide-y divide-amber-100">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-4 py-2.5 text-xs"
            >
              <span className="text-slate-500 font-bold">{row.label}</span>
              <span className="text-slate-800 font-mono font-extrabold text-right">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {status === "checking" && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs font-bold text-amber-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            Simulating transaction on-chain…
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This transaction would fail: {error ?? "Simulation reverted."}
            </span>
          </div>
        )}

        {status === "ready" && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            Simulation passed — safe to sign.
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={status !== "ready"}
            className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-all"
          >
            Confirm & Sign
          </button>
        </div>
      </div>
    </div>
  );
}
