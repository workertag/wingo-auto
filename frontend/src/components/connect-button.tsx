import { api } from "@lib";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSiweMessage } from "viem/siwe";
import {
  useAccount,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
} from "wagmi";
import { authQueryOptions } from "@/hooks/use-auth";
import { formatWalletAddress } from "@/lib/utils";
import { getContractChainId } from "@/providers/web3-provider";
import { useAuthStore } from "@/stores/auth-store";

interface SiweAuthOptions {
  referenceCode?: string;
}

function useSiweAuth({ referenceCode }: SiweAuthOptions = {}) {
  const account = useAccount();
  const { signMessageAsync: signMessage } = useSignMessage();
  const {
    switchChainAsync,
    isPending: isSwitchingChain,
    error: switchChainError,
  } = useSwitchChain();
  const { clearUser, setPendingWallet } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // wagmi only resolves `account.chain` when the wallet's active network is
  // one of the chains configured in wagmiConfig. If it's on a wrong chain,
  // we prompt them to switch to the target contract chain.
  const isWrongNetwork =
    account.isConnected &&
    (account.chain == null || account.chain.id !== getContractChainId());

  const switchToTargetChain = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: getContractChainId() });
    } catch {
      // surfaced via switchChainError
    }
  }, [switchChainAsync]);

  // Auto-switch the moment the wallet lands on the wrong network — the user
  // shouldn't have to notice and click a button first. Guarded so a rejected
  // switch doesn't retry in a loop; it resets once the network is fixed.
  const autoSwitchAttemptedRef = useRef(false);
  useEffect(() => {
    if (!isWrongNetwork) {
      autoSwitchAttemptedRef.current = false;
      return;
    }
    if (autoSwitchAttemptedRef.current) return;
    autoSwitchAttemptedRef.current = true;
    switchToTargetChain();
  }, [isWrongNetwork, switchToTargetChain]);

  // If the wallet is already connected on first render it's an auto-reconnect
  // (wagmi remembered the session). We do NOT auto-fire SIWE in that case —
  // the user must click "Sign In" explicitly. For user-initiated connects
  // (modal → wallet selected) the ref starts false and SIWE fires.
  const attemptedRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (account.isConnected) {
        attemptedRef.current = true;
      }
    }
  }, []);

  const [siweStatus, setSiweStatus] = useState<"idle" | "pending" | "error">(
    "idle",
  );
  const [siweError, setSiweError] = useState<string | null>(null);

  const runSiwe = useCallback(async () => {
    if (!account.address || account.chain == null) return;

    const address = account.address;
    const chainId = account.chain.id;

    setSiweStatus("pending");
    setSiweError(null);

    try {
      const { data, error: nonceError } = await api.auth.siwe.nonce.get();
      if (nonceError || !data?.nonce) throw new Error("Failed to get nonce");

      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to gmc",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: data.nonce,
      });

      const signature = await signMessage({ message });

      const { data: verifyData, response } = await api.auth.siwe.verify.post({
        message,
        signature,
      });

      if (!response.ok) throw new Error("Verification failed");

      if (verifyData?.status === "committed") {
        const userRes = await queryClient.fetchQuery(authQueryOptions);
        setSiweStatus("idle");
        if (userRes?.data?.roleId === 0) {
          navigate({ to: "/admin/dashboard" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } else {
        // New wallet — stash address and redirect to /commit to enter referral code
        setPendingWallet(address);
        setSiweStatus("idle");
        navigate({
          to: "/commit",
          search: referenceCode ? { reference: referenceCode } : {},
        });
      }
    } catch (err) {
      setSiweError(err instanceof Error ? err.message : "Sign-in failed");
      setSiweStatus("error");
      attemptedRef.current = false; // allow retry
    }
  }, [
    account.address,
    account.chain,
    signMessage,
    queryClient,
    navigate,
    referenceCode,
    setPendingWallet,
  ]);

  // Auto-fire SIWE only for user-initiated wallet connects (not auto-reconnects).
  useEffect(() => {
    if (
      !account.isConnected ||
      !account.address ||
      account.chain == null ||
      !account.connector ||
      attemptedRef.current
    )
      return;

    attemptedRef.current = true;

    // Small delay to allow Wagmi's internal connection state to fully hydrate
    // Prevents "connection.connector.getChainId is not a function" on rapid reconnects
    const timer = setTimeout(() => {
      runSiwe();
    }, 200);

    return () => clearTimeout(timer);
  }, [
    account.isConnected,
    account.address,
    account.chain?.id,
    account.connector,
    runSiwe,
  ]);

  // Reset state when wallet disconnects.
  useEffect(() => {
    if (!account.isConnected) {
      attemptedRef.current = false;
      setSiweStatus("idle");
      setSiweError(null);
      clearUser();
      queryClient.invalidateQueries({ queryKey: authQueryOptions.queryKey });
    }
  }, [account.isConnected, clearUser, queryClient]);

  // If the wallet switches to a different account while a session was
  // already signed in, that session belongs to the old address — clear it
  // and let the auto-fire SIWE effect above re-authenticate the new one.
  const lastSignedInAddressRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!account.isConnected || !account.address) {
      lastSignedInAddressRef.current = undefined;
      return;
    }
    const previous = lastSignedInAddressRef.current;
    if (previous && previous.toLowerCase() !== account.address.toLowerCase()) {
      attemptedRef.current = false;
      setSiweStatus("idle");
      setSiweError(null);
      clearUser();
      queryClient.invalidateQueries({ queryKey: authQueryOptions.queryKey });
    }
    lastSignedInAddressRef.current = account.address;
  }, [account.isConnected, account.address, clearUser, queryClient]);

  // Manual sign-in trigger — used by ReconnectPrompt when session has expired
  // but wagmi is still connected (auto-reconnect on page load).
  const triggerSiwe = useCallback(async () => {
    if (!account.isConnected || !account.address || siweStatus === "pending")
      return;
    attemptedRef.current = false;
    await runSiwe();
  }, [account.isConnected, account.address, siweStatus, runSiwe]);

  return {
    siweStatus,
    siweError,
    triggerSiwe,
    isWrongNetwork,
    switchToBsc: switchToTargetChain,
    isSwitchingChain,
    switchChainError,
  };
}

export function ConnectButton({
  referenceCode,
}: {
  referenceCode?: string;
} = {}) {
  const account = useAccount();
  const { openConnectModal } = useConnectModal();
  const {
    siweStatus,
    siweError,
    triggerSiwe,
    isWrongNetwork,
    switchToBsc: switchToTargetChain,
    isSwitchingChain,
    switchChainError,
  } = useSiweAuth({ referenceCode });

  // Use the live query result — not the stale Zustand store — to decide whether
  // to show the connected state. This prevents the localStorage snapshot from
  // making us look logged-in when the server session has actually expired.
  const { data: authData, isLoading: isAuthLoading } =
    useQuery(authQueryOptions);
  const isServerAuthenticated = !!authData?.data;

  // Show a brief neutral state while the auth check is in-flight so stale
  // localStorage data can't briefly render the wrong UI.
  if (isAuthLoading) {
    return (
      <button
        type="button"
        disabled
        className="w-full px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl text-sm sm:text-base font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] opacity-60 cursor-not-allowed shadow-md"
      >
        Checking…
      </button>
    );
  }

  // Wallet connected + server confirms the session is active.
  if (account.isConnected && isServerAuthenticated) {
    return (
      <ConnectedMenu
        address={account.address!}
        walletName={account.connector?.name}
        walletIcon={account.connector?.icon}
      />
    );
  }

  // Wallet connected but sitting on a wrong network — the
  // sign-in flow can't proceed until the wallet switches networks.
  if (account.isConnected && isWrongNetwork) {
    return (
      <WrongNetworkPrompt
        onSwitch={switchToTargetChain}
        isSwitching={isSwitchingChain}
        error={switchChainError?.message ?? null}
      />
    );
  }

  // Wallet auto-reconnected on page load but session has expired (or never
  // existed for this wallet). The user must explicitly click "Sign In".
  if (account.isConnected) {
    return (
      <ReconnectPrompt
        address={account.address!}
        walletName={account.connector?.name}
        walletIcon={account.connector?.icon}
        onSign={triggerSiwe}
        siweStatus={siweStatus}
        siweError={siweError}
      />
    );
  }

  // Not connected — normal Connect Wallet button.
  return (
    <div className="flex flex-col items-center w-full gap-2">
      <button
        type="button"
        onClick={() => openConnectModal?.()}
        disabled={siweStatus === "pending"}
        className="w-full px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl text-sm sm:text-base font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-[var(--gmc-gold)] via-[var(--gmc-gold-bright)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-xl shadow-[var(--gmc-gold)]/25 hover:shadow-2xl transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {siweStatus === "pending" ? "Signing in…" : "Connect Web3 Wallet"}
      </button>
      {siweError && (
        <p className="text-xs text-[var(--gmc-product-crimson)] font-semibold text-center">
          {siweError}
        </p>
      )}
    </div>
  );
}

function WrongNetworkPrompt({
  onSwitch,
  isSwitching,
  error,
}: {
  onSwitch: () => void;
  isSwitching: boolean;
  error: string | null;
}) {
  const { disconnect } = useDisconnect();

  return (
    <div className="flex flex-col items-center w-full gap-2">
      <button
        type="button"
        onClick={onSwitch}
        disabled={isSwitching}
        className="w-full px-6 py-3.5 rounded-2xl text-sm font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-lg shadow-[var(--gmc-gold)]/25 transition-all duration-300 active:scale-95 disabled:opacity-60 cursor-pointer"
      >
        {isSwitching ? "Switching…" : "Switch Network"}
      </button>
      {error && (
        <p className="text-xs text-[var(--gmc-product-crimson)] font-semibold text-center">
          Please switch your wallet to the correct network.
        </p>
      )}
      <button
        type="button"
        onClick={() => disconnect()}
        className="text-xs text-slate-500 hover:text-[var(--gmc-gold-deep)] underline font-medium cursor-pointer"
      >
        Use a different wallet
      </button>
    </div>
  );
}

function ReconnectPrompt({
  address,
  walletName,
  walletIcon,
  onSign,
  siweStatus,
  siweError,
}: {
  address: string;
  walletName: string | undefined;
  walletIcon: string | undefined;
  onSign: () => void;
  siweStatus: "idle" | "pending" | "error";
  siweError: string | null;
}) {
  const { disconnect } = useDisconnect();
  const short = formatWalletAddress(address);

  return (
    <div className="flex flex-col items-center w-full gap-2">
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50/80 border border-[var(--gmc-gold)]/30 text-xs font-bold text-[var(--gmc-mahogany-dark)]">
        {walletIcon && (
          <img
            src={walletIcon}
            alt={walletName}
            className="w-4 h-4 rounded-full"
          />
        )}
        <span className="font-mono">{short}</span>
      </div>
      <button
        type="button"
        onClick={onSign}
        disabled={siweStatus === "pending"}
        className="w-full px-6 py-3.5 rounded-2xl text-sm font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-[var(--gmc-gold)] via-[var(--gmc-gold-bright)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-xl shadow-[var(--gmc-gold)]/25 transition-all duration-300 active:scale-95 disabled:opacity-60 cursor-pointer"
      >
        {siweStatus === "pending" ? "Logging in…" : "Log In"}
      </button>
      {siweError && (
        <p className="text-xs text-[var(--gmc-product-crimson)] font-semibold text-center">
          {siweError}
        </p>
      )}
      <button
        type="button"
        onClick={() => disconnect()}
        className="text-xs text-slate-500 hover:text-[var(--gmc-gold-deep)] underline font-medium cursor-pointer"
      >
        Use a different wallet
      </button>
    </div>
  );
}

function ConnectedMenu({
  address,
  walletName,
  walletIcon,
}: {
  address: string;
  walletName: string | undefined;
  walletIcon: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const { disconnect } = useDisconnect();
  const { clearUser } = useAuthStore();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    try {
      await api.auth.siwe.logout.post({});
    } catch {
      // Session may already be expired — continue with local cleanup.
    }
    clearUser();
    queryClient.invalidateQueries({ queryKey: authQueryOptions.queryKey });
    disconnect();
    setOpen(false);
  }

  const short = formatWalletAddress(address);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
        style={{ borderColor: "var(--line)" }}
      >
        {walletIcon && (
          <img
            src={walletIcon}
            alt={walletName}
            className="w-5 h-5 rounded-full"
          />
        )}
        <span>{short}</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 z-20 rounded-xl border shadow-xl py-1 min-w-[160px]"
            style={{
              background: "var(--surface-strong)",
              borderColor: "var(--line)",
              backdropFilter: "blur(8px)",
            }}
          >
            {walletName && (
              <div
                className="px-4 py-2 text-xs font-medium"
                style={{ color: "var(--tb-ink-soft)" }}
              >
                {walletName}
              </div>
            )}
            <div style={{ borderTop: "1px solid var(--line)" }} />
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors text-destructive"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
