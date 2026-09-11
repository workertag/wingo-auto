export function AppBootFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--gmc-gold-champagne)] border-t-[var(--gmc-gold)]" />
    </div>
  );
}
