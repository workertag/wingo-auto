import { Check, Copy, MoveDownLeft, MoveDownRight } from "lucide-react";
import { useState } from "react";

interface ReferralCodesCardProps {
  leftCode?: string | null;
  rightCode?: string | null;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy copy
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function inviteLink(code: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/login?reference=${code}`;
}

function CodeBlock({
  side,
  code,
}: {
  side: "left" | "right";
  code?: string | null;
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const link = code ? inviteLink(code) : "";
  const Icon = side === "left" ? MoveDownLeft : MoveDownRight;

  const handleCopy = async (value: string, setter: (v: boolean) => void) => {
    const ok = await copyText(value);
    if (ok) {
      setter(true);
      setTimeout(() => setter(false), 2000);
    }
  };

  return (
    <div className="flex-1 min-w-0 bg-amber-50/30 border border-amber-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-[var(--gmc-gold-deep)]" />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
          {side === "left" ? "Left Leg Code" : "Right Leg Code"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 bg-white border border-amber-100 rounded-xl p-2 px-3">
        <span className="font-mono text-lg font-black text-slate-900 tracking-wider uppercase truncate">
          {code ?? "—"}
        </span>
        {code && (
          <button
            type="button"
            onClick={() => handleCopy(code, setCopiedCode)}
            className="p-1.5 bg-amber-50 hover:bg-amber-100/60 text-[var(--gmc-gold-deep)] border border-amber-200/40 rounded-lg transition-all inline-flex items-center justify-center cursor-pointer shrink-0"
            title="Copy code"
          >
            {copiedCode ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        )}
      </div>

      {code && (
        <div className="flex items-center justify-between gap-2 bg-white border border-amber-100 rounded-xl p-2 px-3">
          <span className="font-mono text-[11px] text-slate-600 truncate flex-1">
            {link}
          </span>
          <button
            type="button"
            onClick={() => handleCopy(link, setCopiedLink)}
            className="p-1.5 bg-amber-50 hover:bg-amber-100/60 text-[var(--gmc-gold-deep)] border border-amber-200/40 rounded-lg transition-all inline-flex items-center justify-center cursor-pointer shrink-0"
            title="Copy invite link"
          >
            {copiedLink ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Displays the current user's own leftCode/rightCode pair with copyable
 * invite links. Whichever code a new signup enters at `/login?reference=`
 * determines both their sponsor (this user) and which leg they land on -
 * left for `leftCode`, right for `rightCode` - so sharing one vs. the
 * other is how a member steers where their downline grows.
 */
export default function ReferralCodesCard({
  leftCode,
  rightCode,
}: ReferralCodesCardProps) {
  return (
    <div className="bg-white/95 backdrop-blur-md border border-amber-200/40 rounded-3xl p-5 sm:p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider leading-none">
          My Referral Codes
        </h3>
        <p className="text-xs font-semibold text-slate-500 mt-1.5">
          Share your left code or right code to grow that side of your team —
          the code itself decides where a new signup is placed.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <CodeBlock side="left" code={leftCode} />
        <CodeBlock side="right" code={rightCode} />
      </div>
    </div>
  );
}
