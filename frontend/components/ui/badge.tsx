import * as React from "react";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "success" | "warning";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={[
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "default" && "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
      variant === "secondary" && "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
      variant === "outline" && "border-border text-foreground",
      variant === "destructive" && "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
      variant === "success" && "border-transparent bg-success text-success-foreground hover:bg-success/90",
      variant === "warning" && "border-transparent bg-warning text-warning-foreground hover:bg-warning/90",
      className,
    ].filter(Boolean).join(" ")}
    {...props}
  />
));

Badge.displayName = "Badge";

export { Badge };
