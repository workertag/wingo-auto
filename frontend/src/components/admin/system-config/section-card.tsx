export function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-6 text-left">
      <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
        <Icon size={20} className="text-[var(--gmc-gold-deep)]" />
        {title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="md:col-span-2">
      <label className="flex items-center justify-between px-4 py-3 rounded-xl border border-amber-200/60 bg-amber-50/10 cursor-pointer hover:border-[var(--gmc-gold)]/40 transition-all">
        <span>
          <span className="block text-sm font-bold text-slate-800">
            {label}
          </span>
          <span className="block text-[11px] text-slate-500 mt-0.5">
            {hint}
          </span>
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="size-5 accent-[var(--gmc-gold)] cursor-pointer shrink-0 ml-4"
        />
      </label>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? (
    <em className="text-destructive text-xs not-italic block mt-1">
      {message}
    </em>
  ) : null;
}
