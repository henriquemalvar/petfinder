import Link from "next/link";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: { icon: "h-6 w-6", text: "text-lg" },
  md: { icon: "h-8 w-8", text: "text-xl md:text-2xl" },
};

interface PetFinderLogoProps {
  href?: string;
  showText?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function PetFinderLogo({
  href = "/",
  showText = true,
  size = "md",
  className,
}: PetFinderLogoProps) {
  const sizes = sizeClasses[size];

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-bold text-primary",
        className,
      )}
    >
      <PawPrint className={sizes.icon} />
      {showText && <span className={sizes.text}>PetFinder</span>}
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
