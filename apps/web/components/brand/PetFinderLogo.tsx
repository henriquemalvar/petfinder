import Link from "next/link";
import { cn } from "@/lib/utils";

function PawIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <ellipse cx="12" cy="16.5" rx="5" ry="4" />
      <ellipse cx="5.6" cy="11" rx="1.9" ry="2.6" transform="rotate(-22 5.6 11)" />
      <ellipse cx="9.7" cy="7.3" rx="1.8" ry="2.7" transform="rotate(-8 9.7 7.3)" />
      <ellipse cx="14.3" cy="7.3" rx="1.8" ry="2.7" transform="rotate(8 14.3 7.3)" />
      <ellipse cx="18.4" cy="11" rx="1.9" ry="2.6" transform="rotate(22 18.4 11)" />
    </svg>
  );
}

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
      <PawIcon className={sizes.icon} />
      {showText && <span className={sizes.text}>PetFinder</span>}
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
