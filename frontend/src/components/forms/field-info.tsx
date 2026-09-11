import type { AnyFieldApi } from "@tanstack/react-form";

export function FieldInfo({ field }: { field: AnyFieldApi }) {
  return field.state.meta.isTouched && !field.state.meta.isValid ? (
    <em className="text-destructive text-xs not-italic">
      {field.state.meta.errors
        .map((e) => (e as { message?: string })?.message ?? String(e))
        .join(", ")}
    </em>
  ) : null;
}
