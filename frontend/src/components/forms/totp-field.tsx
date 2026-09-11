import type { AnyFieldApi } from "@tanstack/react-form";
import { FieldInfo } from "@/components/forms/field-info";

export function TotpInput({
  field,
  className,
}: {
  field: AnyFieldApi;
  className?: string;
}) {
  return (
    <div className="space-y-1">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) =>
          field.handleChange(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        className={
          className ??
          "w-full px-3 py-2 rounded-lg border text-sm font-mono tracking-[0.3em] text-center outline-none"
        }
      />
      <FieldInfo field={field} />
    </div>
  );
}
