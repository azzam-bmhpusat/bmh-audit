import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import {
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  InfoIcon,
  CircleDotIcon,
} from "lucide-react";

export type StatusType = "success" | "warning" | "danger" | "info" | "neutral";

const statusBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center font-medium transition-colors select-none rounded-full",
  {
    variants: {
      status: {
        success: "",
        warning: "",
        danger: "",
        info: "",
        neutral: "",
      },
      variant: {
        subtle: "border shadow-2xs",
        outline: "bg-transparent border",
        solid: "border-transparent text-primary-foreground",
      },
      size: {
        default: "h-6 gap-1.5 px-2.5 py-0.5 text-xs [&>svg]:size-3.5",
        sm: "h-5 gap-1 px-2 py-0.5 text-[11px] [&>svg]:size-3",
        xs: "h-4 gap-1 px-1.5 py-0 text-[10px] leading-none [&>svg]:size-2.5",
      },
    },
    compoundVariants: [
      // Subtle (Soft Tint) - Standar Default
      {
        status: "success",
        variant: "subtle",
        className: "bg-success-bg text-success-text border-success-border",
      },
      {
        status: "warning",
        variant: "subtle",
        className: "bg-warning-bg text-warning-text border-warning-border",
      },
      {
        status: "danger",
        variant: "subtle",
        className: "bg-danger-bg text-danger-text border-danger-border",
      },
      {
        status: "info",
        variant: "subtle",
        className: "bg-info-bg text-info-text border-info-border",
      },
      {
        status: "neutral",
        variant: "subtle",
        className: "bg-neutral-bg text-neutral-text border-neutral-border",
      },

      // Outline
      {
        status: "success",
        variant: "outline",
        className: "text-success-text border-success-border",
      },
      {
        status: "warning",
        variant: "outline",
        className: "text-warning-text border-warning-border",
      },
      {
        status: "danger",
        variant: "outline",
        className: "text-danger-text border-danger-border",
      },
      {
        status: "info",
        variant: "outline",
        className: "text-info-text border-info-border",
      },
      {
        status: "neutral",
        variant: "outline",
        className: "text-neutral-text border-neutral-border",
      },

      // Solid
      {
        status: "success",
        variant: "solid",
        className: "bg-success-text text-white",
      },
      {
        status: "warning",
        variant: "solid",
        className: "bg-warning-text text-white",
      },
      {
        status: "danger",
        variant: "solid",
        className: "bg-danger-text text-white",
      },
      {
        status: "info",
        variant: "solid",
        className: "bg-info-text text-white",
      },
      {
        status: "neutral",
        variant: "solid",
        className: "bg-neutral-text text-white",
      },
    ],
    defaultVariants: {
      status: "neutral",
      variant: "subtle",
      size: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  status?: StatusType;
  label?: React.ReactNode;
  icon?: React.ReactNode | boolean;
}

const defaultIcons: Record<StatusType, React.ReactElement> = {
  success: <CheckCircle2Icon aria-hidden="true" />,
  warning: <ClockIcon aria-hidden="true" />,
  danger: <AlertCircleIcon aria-hidden="true" />,
  info: <InfoIcon aria-hidden="true" />,
  neutral: <CircleDotIcon aria-hidden="true" />,
};

export function StatusBadge({
  status = "neutral",
  variant = "subtle",
  size = "default",
  label,
  icon,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const content = label ?? children;
  
  let renderIcon: React.ReactNode = null;
  if (React.isValidElement(icon)) {
    renderIcon = icon;
  } else if (icon === true) {
    renderIcon = defaultIcons[status];
  }

  return (
    <span
      className={cn(statusBadgeVariants({ status, variant, size }), className)}
      {...props}
    >
      {renderIcon}
      {content && <span className="truncate">{content}</span>}
    </span>
  );
}

export { statusBadgeVariants };
