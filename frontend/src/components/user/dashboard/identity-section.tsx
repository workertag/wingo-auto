import {
  Check,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { FaRegHandPointLeft, FaRegHandPointRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface IdentitySectionProps {
  // biome-ignore lint/suspicious/noExplicitAny: user typing
  user: any;
}

const EMOJIS = [
  "🚀",
  "🐼",
  "💎",
  "🦄",
  "👑",
  "🎯",
  "🤵🏻‍♂️",
  "👩🏻‍💼",
  "🦊",
  "🦁",
  "👻",
  "☠️",
  "💸",
  "👸🏻",
  "🤴🏻",
  "🌟",
];

async function copyToClipboardFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_err) {}

  try {
    const textSpace = document.createElement("textarea");
    textSpace.value = text;
    textSpace.style.position = "fixed";
    textSpace.style.top = "0";
    textSpace.style.left = "0";
    textSpace.style.width = "2em";
    textSpace.style.height = "2em";
    textSpace.style.padding = "0";
    textSpace.style.border = "none";
    textSpace.style.outline = "none";
    textSpace.style.boxShadow = "none";
    textSpace.style.background = "transparent";

    document.body.appendChild(textSpace);
    textSpace.focus();
    textSpace.select();

    const range = document.createRange();
    range.selectNodeContents(textSpace);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    textSpace.setSelectionRange(0, 999999);

    const success = document.execCommand("copy");
    document.body.removeChild(textSpace);
    return success;
  } catch (_err) {
    return false;
  }
}

export function IdentitySection({ user }: IdentitySectionProps) {
  const name = user?.profile?.firstName || "Broker";
  const canRefer = !!user?.firstInvestment;

  const [activeLeg, setActiveLeg] = useState<"left" | "right">("left");

  const leftCode = user?.referral?.leftCode;
  const rightCode = user?.referral?.rightCode;
  const activeCode = activeLeg === "left" ? leftCode : rightCode;

  const referralLink = activeCode
    ? `${window.location.origin}/login?reference=${activeCode}`
    : null;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLeftRef, setCopiedLeftRef] = useState(false);
  const [copiedRightRef, setCopiedRightRef] = useState(false);

  // Mobile Bottom Sheet / Modal for Invite Actions
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Emoji Avatar Cycling logic
  const [avatarEmoji, setAvatarEmoji] = useState("🤵");

  useEffect(() => {
    const savedEmoji = localStorage.getItem(
      `gmc_avatar_emoji_${user?.id ?? "default"}`,
    );
    if (savedEmoji) {
      setAvatarEmoji(savedEmoji);
    } else {
      const defaultIndex = (user?.id || 0) % EMOJIS.length;
      setAvatarEmoji(EMOJIS[defaultIndex] ?? "🤵");
    }
  }, [user?.id]);

  const cycleEmoji = () => {
    const currentIndex = EMOJIS.indexOf(avatarEmoji);
    const nextIndex = (currentIndex + 1) % EMOJIS.length;
    const nextEmoji = EMOJIS[nextIndex] ?? "🤵";
    setAvatarEmoji(nextEmoji);
    localStorage.setItem(
      `gmc_avatar_emoji_${user?.id ?? "default"}`,
      nextEmoji,
    );
    window.dispatchEvent(new Event("gmc-avatar-updated"));
    toast.success(`Avatar updated to ${nextEmoji}!`);
  };

  const handleCopyLink = async () => {
    if (!referralLink || !canRefer) return;
    const success = await copyToClipboardFallback(referralLink);
    if (success) {
      setCopiedLink(true);
      toast.success(`${activeLeg === "left" ? "Left" : "Right"} leg invite link copied`);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyValue = async (value: string, type: "id" | "leftRef" | "rightRef") => {
    const success = await copyToClipboardFallback(value);
    if (success) {
      if (type === "id") {
        setCopiedId(true);
        toast.success("Broker ID copied");
        setTimeout(() => setCopiedId(false), 2000);
      } else if (type === "leftRef") {
        setCopiedLeftRef(true);
        toast.success("Left leg referral code copied");
        setTimeout(() => setCopiedLeftRef(false), 2000);
      } else {
        setCopiedRightRef(true);
        toast.success("Right leg referral code copied");
        setTimeout(() => setCopiedRightRef(false), 2000);
      }
    } else {
      toast.error("Failed to copy");
    }
  };

  const handleLegSelect = (leg: "left" | "right") => {
    if (activeLeg === leg) {
      const code = leg === "left" ? leftCode : rightCode;
      if (code) {
        handleCopyValue(code, leg === "left" ? "leftRef" : "rightRef");
      }
    } else {
      setActiveLeg(leg);
    }
  };

  const handleShare = async () => {
    if (!referralLink || !canRefer) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join GMC Trading",
          text: `Register and start crypto arbitrage trading with me on my ${activeLeg} leg!`,
          url: referralLink,
        });
      } else {
        handleCopyLink();
      }
    } catch (_error) {}
  };

  const downloadQrCode = () => {
    if (!referralLink || !canRefer) return;
    const svgElement =
      document.querySelector("#invite-qr svg") ||
      document.querySelector("#invite-qr-mobile svg");
    if (!svgElement) {
      toast.error("Could not find QR Code");
      return;
    }
    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const link = document.createElement("a");
      link.href = blobURL;
      link.download = `gmc-invite-qr-${activeLeg}-${activeCode || "code"}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR Code downloaded (.svg)");
    } catch (_err) {
      toast.error("Failed to download QR");
    }
  };

  return (
    <div className="relative">
      {/* ── NATIVE MOBILE LAYOUT (Premium Profile Header for Mobile Only) ── */}
      <div className="sm:hidden flex items-center justify-between p-4 rounded-3xl bg-white/95 border border-amber-200/40 shadow-md shadow-amber-950/5 text-slate-800">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Cycle Avatar Button */}
          <button
            type="button"
            onClick={cycleEmoji}
            className="relative w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-100/60 to-amber-100/80 border border-amber-300 shadow-2xs flex items-center justify-center text-3xl transition-transform active:scale-95 duration-200 group"
            title="Tap to change avatar emoji"
          >
            <span className="relative z-10">{avatarEmoji}</span>
            <div className="absolute inset-0 rounded-2xl border border-amber-400/40 animate-pulse" />
          </button>

          <div className="space-y-0.5 min-w-0">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              Welcome back
            </p>
            <h2 className="text-sm font-extrabold text-slate-900 leading-tight truncate max-w-[150px]">
              {name}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-medium text-slate-400">
                ID: #{user?.id}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Quick Action Pills */}
        <div className="flex items-center gap-2 shrink-0">
          {(leftCode || rightCode) && (
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white font-extrabold text-xs shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <QrCode className="w-3.5 h-3.5 text-white" />
              <span>Invite</span>
            </button>
          )}
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (Clean premium wide card layout - visible on sm screens and larger) ── */}
      <div className="hidden sm:block relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/85 p-6 shadow-md shadow-amber-950/5 text-slate-800 animate-fade-in-up">
        {/* Background radial glow */}
        <div className="absolute top-1/2 left-1/4 w-[350px] h-[150px] bg-amber-100/50 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left / Center Info */}
          <div className="md:col-span-9 flex flex-col gap-5">
            <div className="flex flex-row sm:items-center gap-4.5">
              {/* Interactive Emoji Avatar Circle */}
              <div className="relative shrink-0 group">
                <button
                  type="button"
                  onClick={cycleEmoji}
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-50 via-orange-100/50 to-amber-200 border border-amber-300 shadow-md group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 text-5xl z-10 cursor-pointer"
                  title="Click to cycle avatar emoji!"
                >
                  <span>{avatarEmoji}</span>
                </button>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] opacity-40 blur-xs scale-105 group-hover:opacity-60 transition-opacity" />
                <div className="absolute -bottom-1 -right-1 bg-white border border-amber-200 rounded-lg p-0.5 shadow-2xs group-hover:scale-110 transition-transform">
                  <Sparkles className="w-3 h-3 text-[var(--gmc-gold)]" />
                </div>
              </div>

              {/* Identity text */}
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    Welcome back,{" "}
                    <span className="text-[var(--gmc-gold-deep)]">{name}</span>
                  </h2>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    <span>Active Account</span>
                  </div>
                </div>

                {/* ID & Ref Code switcher */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-600">
                  <button
                    type="button"
                    onClick={() => handleCopyValue(String(user?.id), "id")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/80 hover:border-[var(--gmc-gold)]/40 hover:bg-amber-100/60 transition-all cursor-pointer shadow-2xs group shrink-0"
                  >
                    <span>User ID:</span>
                    <span className="font-bold text-slate-900">
                      #{user?.id}
                    </span>
                    {copiedId ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5 text-slate-400 group-hover:text-[var(--gmc-gold-deep)]" />
                    )}
                  </button>

                  {(leftCode || rightCode) && (
                    <div className="flex p-0.5 bg-amber-50/60 border border-amber-200/80 rounded-xl shadow-2xs">
                      {leftCode && (
                        <button
                          type="button"
                          onClick={() => handleLegSelect("left")}
                          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            activeLeg === "left"
                              ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-800 hover:bg-amber-100/40"
                          }`}
                          title={activeLeg === "left" ? "Click again to copy Left Leg code" : "Click to select Left Leg placement"}
                        >
                          <FaRegHandPointLeft className={`size-3.5 ${activeLeg === "left" ? "text-white" : "text-[var(--gmc-gold-deep)]"}`} />
                          <span>Left Leg:</span>
                          <span className={activeLeg === "left" ? "text-white" : "text-slate-800"}>
                            {leftCode}
                          </span>
                          {activeLeg === "left" && (
                            copiedLeftRef ? (
                              <Check className="size-3 text-white" />
                            ) : (
                              <Copy className="size-3 text-amber-100" />
                            )
                          )}
                        </button>
                      )}

                      {rightCode && (
                        <button
                          type="button"
                          onClick={() => handleLegSelect("right")}
                          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            activeLeg === "right"
                              ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-800 hover:bg-amber-100/40"
                          }`}
                          title={activeLeg === "right" ? "Click again to copy Right Leg code" : "Click to select Right Leg placement"}
                        >
                          <span>Right Leg:</span>
                          <span className={activeLeg === "right" ? "text-white" : "text-slate-800"}>
                            {rightCode}
                          </span>
                          <FaRegHandPointRight className={`size-3.5 ${activeLeg === "right" ? "text-white" : "text-[var(--gmc-gold-deep)]"}`} />
                          {activeLeg === "right" && (
                            copiedRightRef ? (
                              <Check className="size-3 text-white" />
                            ) : (
                              <Copy className="size-3 text-amber-100" />
                            )
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Invitation Node placement details (Desktop) */}
            {referralLink && (
              <div className="flex flex-col gap-3 border-t border-amber-100 pt-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">
                  INVITATION LINK ({activeLeg === "left" ? "LEFT LEG" : "RIGHT LEG"})
                </span>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                  <div className="flex items-center gap-2 p-2 pl-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex-1 min-w-0 w-full sm:w-auto">
                    <span className="font-mono text-xs text-slate-700 truncate flex-1">
                      {referralLink}
                    </span>
                    <a
                      href={referralLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-white border border-amber-200 text-slate-600 hover:text-[var(--gmc-gold-deep)] hover:border-[var(--gmc-gold)] transition-all cursor-pointer shadow-2xs shrink-0"
                      title="Open page"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </div>

                  <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      disabled={!canRefer}
                      className="flex items-center gap-1.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white text-xs font-black transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                      {copiedLink ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                      <span>Copy Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={!canRefer}
                      className="flex items-center gap-1.5 py-3 px-4 rounded-2xl border border-amber-300 hover:border-[var(--gmc-gold)] text-[var(--gmc-gold-deep)] text-xs font-black transition-all bg-white hover:bg-amber-50 cursor-pointer shadow-2xs disabled:opacity-40"
                    >
                      <Share2 className="size-4" />
                      <span>Share Link</span>
                    </button>
                  </div>
                </div>
                {!canRefer && (
                  <p className="text-[10px] font-semibold text-amber-700">
                    Complete your first investment to activate your network node
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Invite QR Code (Desktop) */}
          {referralLink && (
            <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-amber-200/80 pt-4 md:pt-0 md:pl-6 flex flex-col items-center justify-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">
                {activeLeg === "left" ? "LEFT" : "RIGHT"} LEG QR CODE
              </span>

              {/* QR wrapper */}
              <div
                id="invite-qr"
                className="p-3 bg-white rounded-2xl shadow border border-amber-200 relative group/qr hover:scale-102 transition-all duration-300 cursor-pointer"
              >
                <QRCode
                  value={referralLink}
                  size={96}
                  fgColor="#b45309"
                  className="rounded transition-colors duration-300"
                />
                <button
                  type="button"
                  onClick={downloadQrCode}
                  disabled={!canRefer}
                  className="absolute inset-0 bg-white/95 opacity-0 group-hover/qr:opacity-100 transition-opacity duration-200 rounded-2xl flex flex-col items-center justify-center text-slate-800 gap-1 text-[10px] font-black border border-amber-200"
                >
                  <Download className="h-5.5 w-5.5 text-[var(--gmc-gold-deep)] animate-bounce" />
                  <span>Download SVG</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE MODAL DIALOG (Sleek Bottom Sheet / Native Popup Feeling) ── */}
      {isMounted &&
        showInviteModal &&
        referralLink &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
              aria-label="Close invite modal"
              onClick={() => setShowInviteModal(false)}
            />
            <div className="relative z-10 w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-3xl p-6 border-x border-t border-amber-200/80 sm:border shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 text-slate-800 pb-[calc(24px+env(safe-area-inset-bottom,0px))] cursor-default">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[var(--gmc-gold-deep)]" />
                  <h3 className="text-sm font-black text-slate-900 font-sans">
                    Invite Partnership Node
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="p-1.5 rounded-xl bg-amber-50 text-slate-500 hover:text-slate-900 hover:bg-amber-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Placement Segment Control for Mobile */}
              <div className="grid grid-cols-2 p-1.5 bg-amber-50/60 border border-amber-200/60 rounded-2xl shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleLegSelect("left")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-98 ${
                    activeLeg === "left"
                      ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <FaRegHandPointLeft className={`size-4 ${activeLeg === "left" ? "text-white" : "text-[var(--gmc-gold-deep)]"}`} />
                  <span>Left Leg</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLegSelect("right")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-98 ${
                    activeLeg === "right"
                      ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <span>Right Leg</span>
                  <FaRegHandPointRight className={`size-4 ${activeLeg === "right" ? "text-white" : "text-[var(--gmc-gold-deep)]"}`} />
                </button>
              </div>

              {/* QR Scanner Display */}
              <div className="flex flex-col items-center gap-4">
                <div
                  id="invite-qr-mobile"
                  className="p-3 bg-white rounded-2xl border border-amber-200 shadow-2xs"
                >
                  <QRCode value={referralLink} size={140} fgColor="#b45309" />
                </div>
              </div>

              {/* Quick Actions Form */}
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-center select-all">
                  <p className="font-mono text-[10px] text-slate-700 truncate">
                    {referralLink}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={!canRefer}
                    className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={!canRefer}
                    className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-amber-300 text-[var(--gmc-gold-deep)] bg-white font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={downloadQrCode}
                  disabled={!canRefer}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-amber-300 text-slate-700 font-bold text-xs bg-amber-50/40 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download QR (.svg)</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
