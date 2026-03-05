import { cn } from "@/lib/utils";
import { JobStatus } from "../backend";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  [JobStatus.pending_payment]: {
    label: "Pending Payment",
    className: "bg-muted text-muted-foreground border-border",
  },
  [JobStatus.pending]: {
    label: "Pending Review",
    className:
      "bg-[oklch(0.78_0.16_82/0.15)] text-[oklch(0.85_0.16_82)] border-[oklch(0.78_0.16_82/0.4)]",
  },
  [JobStatus.assigned]: {
    label: "Assigned",
    className:
      "bg-[oklch(0.65_0.16_230/0.15)] text-[oklch(0.75_0.16_230)] border-[oklch(0.65_0.16_230/0.4)]",
  },
  [JobStatus.in_progress]: {
    label: "In Progress",
    className:
      "bg-[oklch(0.72_0.18_50/0.15)] text-[oklch(0.80_0.18_55)] border-[oklch(0.72_0.18_50/0.4)]",
  },
  [JobStatus.completed]: {
    label: "Completed",
    className:
      "bg-[oklch(0.68_0.18_148/0.15)] text-[oklch(0.75_0.18_148)] border-[oklch(0.68_0.18_148/0.4)]",
  },
};

interface StatusBadgeProps {
  status: JobStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono tracking-wide",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
