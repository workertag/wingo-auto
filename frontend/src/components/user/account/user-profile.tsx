import { api } from "@lib";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  ChevronRight,
  Copy,
  Edit2,
  Globe,
  Lock,
  Mail,
  Phone,
  Save,
  Search,
  ShieldCheck,
  User,
  Users,
  Wallet,
  X,
  Share2,
  Download,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { FaRegHandPointLeft, FaRegHandPointRight } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authQueryOptions, useAuth } from "@/hooks/use-auth";
import { formatWalletAddress } from "@/lib/utils";

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

function formatDate(date: string | Date) {
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(date);
  }
}

export default function UserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileCode, setMobileCode] = useState("+27");
  const [mobile, setMobile] = useState("");
  const [countryId, setCountryId] = useState(0);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [activeLeg, setActiveLeg] = useState<"left" | "right">("left");

  // Avatar emoji state & cycler
  const [avatarEmoji, setAvatarEmoji] = useState("🤵");

  // Load countries
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data } = await api.countries.get();
      if (!data?.data) throw new Error("Countries could not be loaded");
      return data.data;
    },
    staleTime: Infinity,
  });

  // Sync state values when user profile loads or changes
  useEffect(() => {
    setIsMounted(true);
    if (user?.profile) {
      setFirstName(user.profile.firstName || "");
      setLastName(user.profile.lastName || "");
      setMobileCode(user.profile.mobileCode || "+27");
      setMobile(user.profile.mobile || "");
      setCountryId(user.profile.countryId || 0);
    }
  }, [user]);

  // Load and cycle emojis matching identity-section.tsx
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

  const copyToClipboard = async (text: string, field: string) => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch (_err) {}

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.padding = "0";
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        textArea.setSelectionRange(0, 999999);

        success = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (_err) {}
    }

    if (success) {
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.error(`Failed to copy ${field}. Please copy manually.`);
    }
  };

  const handleLegSelect = (leg: "left" | "right") => {
    if (activeLeg === leg) {
      const code =
        leg === "left" ? user?.referral?.leftCode : user?.referral?.rightCode;
      if (code) {
        copyToClipboard(
          code,
          leg === "left" ? "Left Leg Code" : "Right Leg Code",
        );
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
        copyToClipboard(referralLink, "Referral Link");
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
      URL.revokeObjectURL(blobURL);
      toast.success("QR Code downloaded successfully!");
    } catch {
      toast.error("Failed to download QR Code");
    }
  };

  const handleCancel = () => {
    if (user?.profile) {
      setFirstName(user.profile.firstName || "");
      setLastName(user.profile.lastName || "");
      setMobileCode(user.profile.mobileCode || "+27");
      setMobile(user.profile.mobile || "");
      setCountryId(user.profile.countryId || 0);
    }
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First name is required.");
      return;
    }
    if (!mobile.trim() || !/^\d{7,15}$/.test(mobile)) {
      toast.error("Mobile number must be between 7 and 15 digits.");
      return;
    }
    if (!/^\+\d{1,4}$/.test(mobileCode)) {
      toast.error("Invalid mobile dial code (e.g. +1 or +27).");
      return;
    }
    if (countryId <= 0) {
      toast.error("Please select a valid country.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        mobileCode: mobileCode.trim(),
        mobile: mobile.trim(),
        countryId,
      };

      const { response, error } = await api.users.profile.patch(payload);
      if (!response.ok) {
        const errorMsg =
          (error as { value?: { message?: string } })?.value?.message ??
          "Failed to update profile details.";
        toast.error(errorMsg);
        return;
      }

      toast.success("Profile updated successfully!");
      await queryClient.invalidateQueries({
        queryKey: authQueryOptions.queryKey,
      });
      setIsEditing(false);
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const selectedCountry = countries.find((c) => c.id === countryId);
  const leftCode = user.referral?.leftCode;
  const rightCode = user.referral?.rightCode;
  const canRefer = !!(user as any).firstInvestment;
  const activeCode = activeLeg === "left" ? leftCode : rightCode;
  const referralLink = activeCode
    ? `${window.location.origin}/login?reference=${activeCode}`
    : "";
  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 relative text-slate-800">
      {/* ── DESKTOP VIEW LAYOUT (Premium Full-Width Banner & Side-by-Side Grid) ── */}
      <div className="hidden sm:flex flex-col space-y-8 relative z-10">
        {/* Top Profile Banner (Full Width) */}
        <div className="w-full bg-white/95 backdrop-blur-md border border-amber-200/40 rounded-3xl p-6 shadow-md flex items-center justify-between gap-6 transition-all duration-300">
          <div className="flex items-center gap-6">
            {/* Interactive Emoji Avatar Button (Desktop) */}
            <div className="relative shrink-0 group">
              <button
                type="button"
                onClick={cycleEmoji}
                className="relative flex h-22 w-22 items-center justify-center rounded-full bg-gradient-to-tr from-amber-50 via-orange-100/50 to-amber-200 border border-amber-300 shadow-md group-hover:scale-105 transition-all duration-300 text-6xl z-10 cursor-pointer"
                title="Click to cycle avatar emoji!"
              >
                <span>{avatarEmoji}</span>
              </button>
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] opacity-40 blur-xs scale-105 group-hover:opacity-60 transition-opacity" />
            </div>

            <div className="space-y-2.5 text-left">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                {firstName} {lastName}
                <div
                  className="inline-flex items-center text-emerald-600"
                  title="Verified Account"
                >
                  <ShieldCheck className="size-6" />
                </div>
              </h2>
              <div className="flex items-center gap-3">
                {/* Interactive UID badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50/60 border border-amber-200/50 rounded-full shadow-3xs text-xs font-bold text-slate-600">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    User ID:
                  </span>
                  <span className="font-mono font-extrabold text-[var(--gmc-gold-deep)]">
                    #{user.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(String(user.id), "User ID")}
                    className="p-1 hover:bg-white rounded-lg text-slate-400 hover:text-[var(--gmc-gold-deep)] transition-all cursor-pointer inline-flex items-center justify-center shrink-0 ml-0.5"
                    title="Copy User ID"
                  >
                    {copiedField === "User ID" ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>

                {/* Member Since Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/60 rounded-full text-xs font-bold text-slate-500">
                  <Calendar className="size-3.5 text-slate-400" />
                  <span>Member Since:</span>
                  <span className="text-slate-800 font-extrabold">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Web3 Card (Desktop Top Banner Right) */}
          <div className="bg-amber-50/40 border border-amber-200/50 p-4 rounded-2xl flex items-center gap-4 max-w-sm shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-[var(--gmc-gold-deep)] flex items-center justify-center shrink-0">
              <Wallet className="size-7" />
            </div>
            <div className="space-y-0.5 overflow-hidden flex-1 text-left min-w-[160px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Web3 Wallet Node
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-slate-700 truncate block">
                {user.evmWallet?.address
                  ? formatWalletAddress(user.evmWallet.address)
                  : "No wallet synced"}
              </span>
            </div>
            {user.evmWallet?.address && (
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    user.evmWallet?.address || "",
                    "Wallet Address",
                  )
                }
                className="p-2.5 hover:bg-white border border-amber-100 rounded-xl text-slate-400 hover:text-[var(--gmc-gold-deep)] transition-colors cursor-pointer"
              >
                {copiedField === "Wallet Address" ? (
                  <Check className="size-5 text-emerald-600" />
                ) : (
                  <Copy className="size-5 text-primary" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Cards: Side-by-Side Grid */}
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 items-start">
          {/* Card 1: Personal Settings */}
          <div className="bg-white/95 backdrop-blur-md border border-amber-200/40 rounded-3xl p-6 sm:p-8 shadow-md h-full">
            <div className="flex items-center gap-2.5 pb-4 border-b border-amber-100 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-[var(--gmc-gold-deep)] flex items-center justify-center border border-amber-100">
                <User className="size-4.5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider leading-none">
                Personal Settings
              </h3>
            </div>

            {!isEditing ? (
              /* DESKTOP VIEW MODE */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-amber-50/20 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[var(--gmc-gold)] shrink-0">
                    <User className="size-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      First Name
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {firstName || "—"}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/20 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[var(--gmc-gold)] shrink-0">
                    <User className="size-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      Last Name
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {lastName || "—"}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/20 border border-amber-100 p-4 rounded-2xl flex items-center justify-between sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[var(--gmc-gold)] shrink-0">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        Email Address
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5 truncate max-w-[280px] md:max-w-[400px]">
                        {user.profile?.email || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 uppercase shrink-0">
                    <Lock className="size-3.5" />
                    <span>Verified</span>
                  </div>
                </div>

                <div className="bg-amber-50/20 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[var(--gmc-gold)] shrink-0">
                    <Globe className="size-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      Country
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <span>{selectedCountry?.emoji || "🌐"}</span>
                      <span>{selectedCountry?.name || "—"}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/20 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[var(--gmc-gold)] shrink-0">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      Mobile Number
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                      {mobile ? `${mobileCode} ${mobile}` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* DESKTOP EDIT MODE */
              <form
                onSubmit={handleSave}
                className="space-y-4 text-left animate-fade-in-up"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="deskFirstName"
                      className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400" />
                      <input
                        id="deskFirstName"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50/10 text-slate-800 outline-none focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/5 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="deskLastName"
                      className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
                    >
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400" />
                      <input
                        id="deskLastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50/10 text-slate-800 outline-none focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/5 transition-all font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                    Country <span className="text-red-500">*</span>
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/10 text-slate-800 text-sm font-semibold outline-none focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/5 transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Globe className="size-4.5 text-slate-400" />
                          <span>
                            {selectedCountry
                              ? `${selectedCountry.emoji} ${selectedCountry.name}`
                              : "Select a country..."}
                          </span>
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                          Select
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[300px] flex flex-col w-[var(--radix-dropdown-menu-trigger-width)] bg-white border border-amber-100 rounded-2xl p-1.5 shadow-xl z-50">
                      <div className="p-1 border-b border-amber-100 flex items-center gap-2 sticky top-0 bg-white z-10 mb-1">
                        <Search className="size-4 text-slate-400 shrink-0 ml-1.5" />
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-amber-150 rounded-lg focus:outline-none focus:border-[var(--gmc-gold)] text-slate-800 font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="overflow-y-auto max-h-[220px] w-full space-y-0.5">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((c) => (
                            <DropdownMenuItem
                              key={c.id}
                              onSelect={() => {
                                setCountryId(c.id);
                                setMobileCode(c.dialCode);
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors focus:bg-amber-50 focus:text-slate-900"
                            >
                              <span className="text-base">{c.emoji}</span>
                              <span className="font-semibold">{c.name}</span>
                              <span className="ml-auto text-xs text-slate-400 font-mono">
                                {c.dialCode}
                              </span>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-xs text-slate-400 text-center font-semibold">
                            No countries matched.
                          </div>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="deskPhone"
                    className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
                  >
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={mobileCode}
                      onChange={(e) => setMobileCode(e.target.value)}
                      className="w-20 px-3 py-2.5 rounded-xl border text-sm font-mono bg-amber-50/10 border-amber-200 text-slate-800 outline-none focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/5 transition-all font-semibold text-center"
                    />
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400" />
                      <input
                        id="deskPhone"
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) =>
                          setMobile(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-amber-50/10 border-amber-200 text-slate-800 outline-none focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/5 transition-all font-semibold placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Desktop Action buttons in card */}
            <div className="pt-6 border-t border-amber-100 mt-6 w-full flex items-center justify-end">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto py-3 px-6 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:shadow-md hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 className="size-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    type="submit"
                    onClick={handleSave}
                    disabled={saving}
                    className="py-3 px-6 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:shadow-md hover:scale-[1.02] active:scale-100 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="py-3 px-6 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-800 bg-amber-50 hover:bg-amber-100/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200"
                  >
                    <X className="size-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Referral Node Hub */}
          <div className="bg-white/95 backdrop-blur-md border border-amber-200/40 rounded-3xl p-6 sm:p-8 shadow-md h-full">
            <div className="flex items-center justify-between pb-4 border-b border-amber-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[var(--gmc-gold-deep)] flex items-center justify-center border border-amber-100">
                  <Users className="size-4.5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider leading-none">
                  Referral Node Hub
                </h3>
              </div>

              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--gmc-gold-deep)] bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full">
                Active Leg: {activeLeg}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12  gap-6 items-start">
              {/* Left Column: Links and Selectors */}
              <div className="space-y-5 text-left lg:col-span-8">
                {/* Leg Select Segment Controller */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Select Placement Node Leg
                  </span>

                  <div className="flex p-0.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl shadow-2xs">
                    {leftCode && (
                      <button
                        type="button"
                        onClick={() => handleLegSelect("left")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          activeLeg === "left"
                            ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-800 hover:bg-amber-100/40"
                        }`}
                        title={
                          activeLeg === "left"
                            ? "Click again to copy Left Leg code"
                            : "Click to select Left Leg placement"
                        }
                      >
                        <FaRegHandPointLeft
                          className={`size-3.5 ${activeLeg === "left" ? "text-white" : "text-[var(--gmc-gold-deep)]"}`}
                        />
                        <span>Left Leg:</span>
                        <span className="font-mono font-bold">{leftCode}</span>
                        {activeLeg === "left" &&
                          (copiedField === "Left Leg Code" ? (
                            <Check className="size-3 text-white" />
                          ) : (
                            <Copy className="size-3 text-amber-100" />
                          ))}
                      </button>
                    )}

                    {rightCode && (
                      <button
                        type="button"
                        onClick={() => handleLegSelect("right")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          activeLeg === "right"
                            ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-800 hover:bg-amber-100/40"
                        }`}
                        title={
                          activeLeg === "right"
                            ? "Click again to copy Right Leg code"
                            : "Click to select Right Leg placement"
                        }
                      >
                        <span>Right Leg:</span>
                        <span className="font-mono font-bold">{rightCode}</span>
                        <FaRegHandPointRight
                          className={`size-3.5 ${activeLeg === "right" ? "text-white" : "text-[var(--gmc-gold-deep)]"}`}
                        />
                        {activeLeg === "right" &&
                          (copiedField === "Right Leg Code" ? (
                            <Check className="size-3 text-white" />
                          ) : (
                            <Copy className="size-3 text-amber-100" />
                          ))}
                      </button>
                    )}
                  </div>
                </div>

                {/* Invite Link Display */}
                {referralLink && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Invitation Link (
                      {activeLeg === "left" ? "LEFT LEG" : "RIGHT LEG"})
                    </span>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-between p-2.5 px-3.5 bg-amber-50/40 border border-amber-200/80 rounded-2xl w-full select-all min-w-0">
                        <span className="font-mono text-xs text-slate-600 truncate flex-1 mr-2">
                          {referralLink}
                        </span>
                        <a
                          href={referralLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-white border border-amber-200 text-slate-600 hover:text-[var(--gmc-gold-deep)] hover:border-[var(--gmc-gold)] transition-all cursor-pointer shadow-2xs shrink-0"
                          title="Open Link"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>

                      <div className="flex gap-2 w-full">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(referralLink, "Referral Link")
                          }
                          disabled={!canRefer}
                          className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white text-xs font-black transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                        >
                          {copiedField === "Referral Link" ? (
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
                          className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl border border-amber-300 hover:border-[var(--gmc-gold)] text-[var(--gmc-gold-deep)] text-xs font-black transition-all bg-white hover:bg-amber-50 cursor-pointer shadow-2xs disabled:opacity-40"
                        >
                          <Share2 className="size-4" />
                          <span>Share Link</span>
                        </button>
                      </div>
                    </div>
                    {!canRefer && (
                      <p className="text-[10px] font-bold text-amber-700 mt-1 pl-1">
                        ⚠️ Complete your first investment to activate your
                        referral links
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: QR Code */}
              {referralLink && (
                <div className="border-amber-200/80 pt-5 md:pt-0 md:pl-6 flex flex-col items-center justify-center gap-4 text-center lg:col-span-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">
                    {activeLeg === "left" ? "LEFT" : "RIGHT"} LEG QR CODE
                  </span>

                  <div
                    id="invite-qr"
                    className="p-3 bg-white rounded-3xl shadow border border-amber-200 relative group/qr hover:scale-102 transition-all duration-300 cursor-pointer"
                  >
                    <QRCode
                      value={referralLink}
                      size={96}
                      fgColor="#7c4804"
                      className="rounded"
                    />
                    <button
                      type="button"
                      onClick={downloadQrCode}
                      disabled={!canRefer}
                      className="absolute inset-0 bg-white/95 opacity-0 group-hover/qr:opacity-100 transition-opacity duration-200 rounded-3xl flex flex-col items-center justify-center text-slate-800 gap-1 text-[10px] font-black border border-amber-200"
                    >
                      <Download className="h-5 w-5 text-[var(--gmc-gold-deep)] animate-bounce" />
                      <span>Download SVG</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── NATIVE MOBILE VIEW LAYOUT (Tailored list widgets + slide up settings) ── */}
      <div className="sm:hidden space-y-6 px-1.5 pb-16">
        {/* Mobile Header Card */}
        <div className="flex gap-4 items-center p-4 bg-white/95 border border-amber-200/40 rounded-3xl shadow-xs">
          {/* Cycle Avatar Button (Mobile) */}
          <button
            type="button"
            onClick={cycleEmoji}
            className="relative w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-100/60 to-amber-100/80 border border-amber-300 shadow-2xs flex items-center justify-center text-3xl transition-transform active:scale-95 duration-200 group"
            title="Tap to change avatar emoji"
          >
            <span className="relative z-10">{avatarEmoji}</span>
            <div className="absolute inset-0 rounded-2xl border border-amber-400/40 animate-pulse" />
          </button>

          <div className="space-y-1.5 text-left">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 uppercase leading-none">
              {firstName} {lastName}
              <ShieldCheck className="size-4.5 text-emerald-600 shrink-0" />
            </h2>

            {/* Interactive User ID Badge with copy button */}
            <div className="inline-flex items-center text-xs font-bold text-slate-600  leading-none">
              <span className="font-mono font-extrabold text-[var(--gmc-gold-deep)]">
                #{user.id}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(String(user.id), "User ID")}
                className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-[var(--gmc-gold-deep)] transition-all cursor-pointer inline-flex items-center justify-center shrink-0 ml-0.5"
                title="Copy User ID"
              >
                {copiedField === "User ID" ? (
                  <Check className="size-3 text-emerald-600" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Web3 EVM Sync Card */}
        <div className="p-4 bg-white/90 border border-slate-100 shadow-xs rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[var(--gmc-gold-deep)] flex items-center justify-center shrink-0 border border-amber-100">
              <Wallet className="size-4.5" />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                Web3 Sync Node
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 truncate block max-w-[150px] xs:max-w-[200px]">
                {user.evmWallet?.address
                  ? formatWalletAddress(user.evmWallet.address)
                  : "Not synced"}
              </span>
            </div>
          </div>
          {user.evmWallet?.address && (
            <button
              type="button"
              onClick={() =>
                copyToClipboard(user.evmWallet?.address || "", "Wallet Key")
              }
              className="p-2 hover:bg-amber-50 text-slate-400 hover:text-[var(--gmc-gold-deep)] rounded-xl border border-slate-100 transition-colors"
            >
              {copiedField === "Wallet Key" ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Profile Details (iOS Settings Style) */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3 text-left">
            Personal Settings
          </p>
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {/* First Name row */}
            <div className="flex items-center justify-between p-3.5 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[var(--gmc-gold-deep)] flex items-center justify-center">
                  <User className="size-4" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">
                    First Name
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {firstName || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Last Name row */}
            <div className="flex items-center justify-between p-3.5 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[var(--gmc-gold-deep)] flex items-center justify-center">
                  <User className="size-4" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">
                    Last Name
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {lastName || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Address row */}
            <div className="flex items-center justify-between p-3.5 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[var(--gmc-gold-deep)] flex items-center justify-center">
                  <Mail className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">
                    Email Address
                  </span>
                  <span className="text-sm font-bold text-slate-900 truncate block max-w-[170px] xs:max-w-[210px]">
                    {user.profile?.email || "—"}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[8px] font-extrabold text-emerald-700 uppercase border border-emerald-100 shrink-0">
                Verified
              </span>
            </div>

            {/* Country row */}
            <div className="flex items-center justify-between p-3.5 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[var(--gmc-gold-deep)] flex items-center justify-center">
                  <Globe className="size-4" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">
                    Country
                  </span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                    <span>{selectedCountry?.emoji || "🌐"}</span>
                    <span>{selectedCountry?.name || "—"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile number row */}
            <div className="flex items-center justify-between p-3.5 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[var(--gmc-gold-deep)] flex items-center justify-center">
                  <Phone className="size-4" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">
                    Mobile Number
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {mobile ? `${mobileCode} ${mobile}` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            <Edit2 className="size-4" />
            <span>Edit Profile Info</span>
          </button>
        </div>

        {/* Mobile Referral section */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3.5 text-left">
            Referral Node Hub
          </p>
          <div className="bg-white border border-slate-100 rounded-3xl shadow-xs p-5 space-y-5 text-left">
            {/* Segmented Leg Controller for Mobile */}
            <div className="grid grid-cols-2 p-1 bg-amber-50/40 border border-amber-200/50 rounded-2xl">
              {leftCode && (
                <button
                  type="button"
                  onClick={() => handleLegSelect("left")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-98 ${
                    activeLeg === "left"
                      ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <FaRegHandPointLeft
                    className={`size-3.5 ${activeLeg === "left" ? "text-white" : "text-[var(--gmc-gold-deep)]"}`}
                  />
                  <span>Left ({leftCode})</span>
                </button>
              )}
              {rightCode && (
                <button
                  type="button"
                  onClick={() => handleLegSelect("right")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-98 ${
                    activeLeg === "right"
                      ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <span>Right ({rightCode})</span>
                  <FaRegHandPointRight
                    className={`size-3.5 ${activeLeg === "right" ? "text-white" : "text-[var(--gmc-gold-deep)]"}`}
                  />
                </button>
              )}
            </div>

            {/* Centered QR Display */}
            {referralLink && (
              <div className="flex flex-col items-center justify-center gap-3 py-2">
                <div
                  id="invite-qr-mobile"
                  className="p-3 bg-white rounded-3xl border border-amber-200 shadow-2xs"
                >
                  <QRCode value={referralLink} size={130} fgColor="#7c4804" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Scan to enroll on {activeLeg} leg
                </span>
              </div>
            )}

            {/* Actions for Mobile */}
            {referralLink && (
              <div className="space-y-3.5">
                <div className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-100 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-600 truncate mr-2 flex-1">
                    {referralLink}
                  </span>
                  <a
                    href={referralLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-400 hover:text-[var(--gmc-gold-deep)] shrink-0"
                    title="Open Link"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(referralLink, "Referral Link")
                    }
                    disabled={!canRefer}
                    className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white text-xs font-black active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-40"
                  >
                    {copiedField === "Referral Link" ? (
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
                    className="flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-amber-300 text-[var(--gmc-gold-deep)] bg-white font-black text-xs active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-40"
                  >
                    <Share2 className="size-4" />
                    <span>Share</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={downloadQrCode}
                  disabled={!canRefer}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-amber-300 text-slate-700 font-bold text-xs bg-amber-50/20 cursor-pointer active:scale-98 transition-all"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Download QR Code (.svg)</span>
                </button>

                {!canRefer && (
                  <p className="text-[10px] font-semibold text-center text-amber-700 mt-1">
                    ⚠️ Complete your first investment to activate referral links
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── NATIVE MOBILE SLIDE-UP EDITOR SHEET (Portal backdrop & sheets) ── */}
      {isMounted &&
        isEditing &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
              aria-label="Close editor"
              onClick={handleCancel}
            />
            <div className="relative z-10 w-full max-w-md bg-white rounded-t-[2.2rem] border-t border-amber-100 p-6 flex flex-col space-y-5 animate-in slide-in-from-bottom duration-300 pb-[calc(24px+env(safe-area-inset-bottom,0px))] max-h-[90vh] overflow-y-auto cursor-default">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4.5 h-4.5 text-[var(--gmc-gold-deep)]" />
                  <h3 className="text-sm font-extrabold text-slate-900 font-sans">
                    Edit Profile Info
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-1.5 rounded-xl bg-amber-50 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inputs Form */}
              <form onSubmit={handleSave} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label
                    htmlFor="mobFirstName"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400" />
                    <input
                      id="mobFirstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50/10 text-sm text-slate-800 outline-none focus:border-[var(--gmc-gold)] font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="mobLastName"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400" />
                    <input
                      id="mobLastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50/10 text-sm text-slate-800 outline-none focus:border-[var(--gmc-gold)] font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Country <span className="text-red-500">*</span>
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/10 text-slate-800 text-sm font-semibold outline-none focus:border-[var(--gmc-gold)]"
                      >
                        <span className="flex items-center gap-2">
                          <Globe className="size-4.5 text-slate-400" />
                          <span className="truncate">
                            {selectedCountry
                              ? `${selectedCountry.emoji} ${selectedCountry.name}`
                              : "Select country..."}
                          </span>
                        </span>
                        <ChevronRight className="size-4 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-[280px] flex flex-col w-[var(--radix-dropdown-menu-trigger-width)] bg-white border border-amber-100 rounded-2xl p-1.5 shadow-xl z-50">
                      <div className="p-1 border-b border-amber-100 flex items-center gap-2 sticky top-0 bg-white z-10 mb-1">
                        <Search className="size-3.5 text-slate-400 shrink-0 ml-1" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-amber-150 rounded-lg focus:outline-none focus:border-[var(--gmc-gold)] text-slate-800 font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="overflow-y-auto max-h-[200px] w-full space-y-0.5">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((c) => (
                            <DropdownMenuItem
                              key={c.id}
                              onSelect={() => {
                                setCountryId(c.id);
                                setMobileCode(c.dialCode);
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors focus:bg-amber-50"
                            >
                              <span className="text-base">{c.emoji}</span>
                              <span className="font-semibold">{c.name}</span>
                              <span className="ml-auto text-xs text-slate-400 font-mono">
                                {c.dialCode}
                              </span>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-xs text-slate-400 text-center font-semibold">
                            No countries matched.
                          </div>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="mobPhone"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={mobileCode}
                      onChange={(e) => setMobileCode(e.target.value)}
                      className="w-20 px-3 py-2.5 rounded-xl border text-sm font-mono bg-amber-50/10 border-amber-200 text-slate-800 outline-none focus:border-[var(--gmc-gold)] font-semibold text-center"
                    />
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400" />
                      <input
                        id="mobPhone"
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) =>
                          setMobile(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-amber-50/10 border-amber-200 text-slate-800 outline-none focus:border-[var(--gmc-gold)] font-semibold placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 bg-amber-50 border border-amber-150 flex items-center justify-center gap-1.5"
                  >
                    <X className="size-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
