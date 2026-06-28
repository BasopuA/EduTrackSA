"use client";

import * as React from "react";

type ResponsiveValue = number | string;
type ResponsiveSize = ResponsiveValue | { xs?: ResponsiveValue; sm?: ResponsiveValue; md?: ResponsiveValue; lg?: ResponsiveValue; xl?: ResponsiveValue };

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  container?: boolean;
  spacing?: number;
  size?: ResponsiveSize;
  sx?: React.CSSProperties & { mt?: number | string; mb?: number | string; p?: number | string; px?: number | string; py?: number | string };
}

function resolveSize(size?: ResponsiveSize) {
  if (!size) return undefined;

  if (typeof size === "object" && !Array.isArray(size)) {
    const entries = Object.entries(size);
    return entries.map(([breakpoint, value]) => `sm:${breakpoint}-${value}`).join(" ");
  }

  return `md-${size}`;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, container = false, spacing = 0, size, style, ...props }, ref) => {
    const spacingValue = spacing ? spacing * 0.5 : 0;
    const resolvedSize = resolveSize(size);

    return (
      <div
        ref={ref}
        className={[
          container ? "grid" : "",
          container && spacing > 0 ? `gap-${spacing}` : "",
          resolvedSize,
          className,
        ].filter(Boolean).join(" ")}
        style={{
          ...style,
          paddingLeft: container ? spacingValue : undefined,
          paddingRight: container ? spacingValue : undefined,
        }}
        {...props}
      />
    );
  }
);

Grid.displayName = "Grid";

export { Grid };
export default Grid;
