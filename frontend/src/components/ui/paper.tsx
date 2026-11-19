import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export const Paper = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn("bg-orange-100 border-2 border-secondary-foreground rounded-2xl p-3 sm:p-6 mx-2", className)}
    {...props}
  />
);
