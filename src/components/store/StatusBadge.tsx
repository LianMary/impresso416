import { STATUS_CLASS, STATUS_LABEL, type OrderStatus } from "@/lib/status";
export function StatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLASS[s]}`}>{STATUS_LABEL[s]}</span>;
}
