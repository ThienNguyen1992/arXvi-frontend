import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have a standard cn utility, if not we'll check or just use standard classes

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export function Spinner({ className, size = 24, ...props }: SpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <Loader2 size={size} className="animate-spin text-primary" />
    </div>
  );
}
