import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "archived" | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<
    string,
    { text: string; className: string }
  > = {
    active: {
      text: "פעיל",
      className: "bg-green-100 text-green-800",
    },
    inactive: {
      text: "לא פעיל",
      className: "bg-red-100 text-red-800",
    },
    pending: {
      text: "ממתין",
      className: "bg-yellow-100 text-yellow-800",
    },
    archived: {
      text: "בארכיון",
      className: "bg-gray-100 text-gray-800",
    },
  };

  const config = statusConfig[status] || {
    text: status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={cn(
        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
        config.className,
        className
      )}
    >
      {config.text}
    </span>
  );
}
