type BadgeVariant = "live" | "upcoming" | "completed";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  live: "bg-danger/20 text-danger",
  upcoming: "bg-accent/20 text-accent-light",
  completed: "bg-muted/20 text-muted",
};

export default function Badge({
  children,
  variant = "upcoming",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {variant === "live" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
        </span>
      )}
      {children}
    </span>
  );
}
