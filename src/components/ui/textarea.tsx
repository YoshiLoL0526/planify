import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-ring/20 disabled:bg-input/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/20 dark:disabled:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/30 bg-card flex field-sizing-content min-h-20 w-full rounded-md border px-3 py-2 text-base shadow-[inset_0_1px_1px_rgb(20_20_25/0.02)] transition-[border-color,box-shadow] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 md:text-[14px]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
