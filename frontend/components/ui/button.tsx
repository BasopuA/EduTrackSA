import * as React from "react";

type ButtonVariant = "default" | "ghost" | "outline" | "contained";
type ButtonSize = "sm" | "default" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    const variantClasses: Record<ButtonVariant, string> = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      contained: "bg-blue-600 text-white hover:bg-blue-700",
    };

    const sizeClasses: Record<ButtonSize, string> = {
      sm: "h-9 rounded-md px-3 text-sm",
      default: "h-10 rounded-md px-4 py-2",
      lg: "h-11 rounded-md px-8",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={[
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].filter(Boolean).join(" ")}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
