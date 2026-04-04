interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({
  children,
  className = "",
  padding = true,
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-bg-card ${padding ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
