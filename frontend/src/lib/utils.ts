import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getAddress } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (fmt === "yyyy-MM-dd") {
    return d.toISOString().slice(0, 10);
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAmount(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatWalletAddress(address: string) {
  const checksummed = getAddress(address);
  return `${checksummed.slice(0, 6)}...${checksummed.slice(-4)}`;
}

const SCANNER_URLS: Record<number, string> = {
  56: "https://bscscan.com",
  // 31337 is the shared anvil "testnet" (frpc.tech), NOT real BSC testnet -
  // testnet.bscscan.com would never show these transactions.
  31337: import.meta.env.VITE_SCANNER_URL ?? "https://scan2.frpc.tech",
};

/** Block-explorer tx link for a chain — bscscan for BSC mainnet (56),
 * scan2.frpc.tech (or VITE_SCANNER_URL) for the anvil dev chain (31337). */
export function getExplorerTxUrl(chainId: number, txHash: string) {
  return `${SCANNER_URLS[chainId] ?? SCANNER_URLS[31337]}/tx/${txHash}`;
}
