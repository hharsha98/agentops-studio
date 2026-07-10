type StatusBadgeProps = {
  status: "online" | "running" | "approval" | "done" | "failed" | "backlog" | "sandbox" | "live";
  label: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
