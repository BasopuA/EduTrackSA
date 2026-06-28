"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue>({});

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Select({ value, onValueChange, disabled, children }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div aria-disabled={disabled}>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  id,
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement> & { id?: string }) {
  return (
    <div
      id={id}
      className={[
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
        "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:bg-accent/50 transition-colors cursor-pointer",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </div>
  );
}

export function SelectValue({ placeholder }: { placeholder: string }) {
  const context = React.useContext(SelectContext);
  return (
    <span className={context.value ? "text-foreground" : "text-muted-foreground"}>
      {context.value || placeholder}
    </span>
  );
}

export function SelectContent({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto overflow-x-hidden rounded-md border bg-popover",
        "p-1 text-popover-foreground shadow-lg",
        "animate-in fade-in-0 zoom-in-95",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className,
}: React.LiHTMLAttributes<HTMLLIElement> & { value: string }) {
  const context = React.useContext(SelectContext);
  const selected = context.value === value;

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => context.onValueChange?.(value)}
      className={[
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground transition-colors",
        selected && "bg-accent text-accent-foreground font-medium",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
