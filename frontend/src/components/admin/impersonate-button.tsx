import { LogIn } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStartImpersonation } from "@/hooks/use-impersonation";
import { useUserId } from "@/stores/auth-store";

export function ImpersonateButton({
  userId,
  roleId,
}: {
  userId: number;
  roleId: number | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const adminId = useUserId();
  const startImpersonation = useStartImpersonation();

  if (roleId === 0 || userId === adminId) return null;

  return (
    <>
      <button
        type="button"
        title="Login as this user"
        onClick={() => setOpen(true)}
        className="h-7 w-7 flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50/50 text-slate-400 hover:text-[var(--gmc-gold-deep)] hover:border-[var(--gmc-gold)]/40 hover:bg-amber-100/50 transition-all cursor-pointer"
      >
        <LogIn size={14} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login as User #{userId}?</DialogTitle>
            <DialogDescription>
              You'll be signed in as this user in place of your admin session.
              Use "Return to Admin" to switch back at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={startImpersonation.isPending}
              onClick={() => startImpersonation.mutate(userId)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 hover:shadow-lg text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              {startImpersonation.isPending ? "Signing in…" : "Confirm"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
