import { STATUS_COR, STATUS_LABEL, type Status } from "@/lib/constantes";

export function StatusBadge({ status }: { status: string }) {
  const s = status as Status;
  return (
    <span className={`badge ${STATUS_COR[s] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {STATUS_LABEL[s] ?? status}
    </span>
  );
}
