import { Crown, User } from "lucide-react";

export interface AutoPoolPosition {
  id: string;
  userId: number;
  depth: number;
  cycleNumber: number;
  status: "active" | "completed";
}

export interface AutoPoolSubtree {
  root: AutoPoolPosition;
  left:
    | (AutoPoolPosition & {
        left: AutoPoolPosition | null;
        right: AutoPoolPosition | null;
      })
    | null;
  right:
    | (AutoPoolPosition & {
        left: AutoPoolPosition | null;
        right: AutoPoolPosition | null;
      })
    | null;
  filledCount: number;
}

function NodeCard({
  node,
  isRoot,
}: {
  node: AutoPoolPosition | null | undefined;
  isRoot?: boolean;
}) {
  if (!node) {
    return (
      <div className="w-24 sm:w-28 p-2.5 rounded-xl border border-dashed border-amber-200 bg-amber-50/10 text-center">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Empty
        </span>
      </div>
    );
  }

  return (
    <div
      className={`w-24 sm:w-28 p-2.5 rounded-xl border text-center transition-all ${
        isRoot
          ? "border-[var(--gmc-gold)] bg-gradient-to-br from-amber-50 to-white shadow-md"
          : "border-amber-100 bg-white shadow-sm"
      }`}
    >
      <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-amber-50 text-[var(--gmc-gold-deep)] border border-amber-100 flex items-center justify-center">
        {isRoot ? (
          <Crown className="w-3.5 h-3.5" />
        ) : (
          <User className="w-3.5 h-3.5" />
        )}
      </div>
      <div className="text-[11px] font-extrabold text-slate-800 truncate">
        #{node.userId}
      </div>
      <div className="text-[9px] font-mono text-slate-400">
        {node.status === "completed" ? "Completed" : "Filling"}
      </div>
    </div>
  );
}

/** Fixed 2-level (root + 2 children + 4 grandchildren) auto-pool subtree -
 * always rendered from the current user's own position as "root", per the
 * product's "always shown as root" design. */
export function AutoPoolTree({ pool }: { pool: AutoPoolSubtree }) {
  return (
    <div className="bg-white/95 backdrop-blur-md border border-amber-200/40 rounded-3xl shadow-sm p-4 md:p-6 overflow-x-auto">
      <div className="min-w-max flex flex-col items-center py-4">
        <NodeCard node={pool.root} isRoot />
        <div className="w-px h-4 bg-amber-200" />
        <div className="flex items-start gap-6 sm:gap-10">
          {[pool.left, pool.right].map((child, i) => (
            <div
              key={i === 0 ? "left" : "right"}
              className="flex flex-col items-center"
            >
              <NodeCard node={child} />
              {child && (
                <>
                  <div className="w-px h-3 bg-amber-200" />
                  <div className="flex items-start gap-3 sm:gap-4">
                    <NodeCard node={child.left} />
                    <NodeCard node={child.right} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-slate-400 font-semibold">
        {pool.filledCount}/6 filled - completes and pays out once all 6 slots
        below root are taken.
      </p>
    </div>
  );
}
