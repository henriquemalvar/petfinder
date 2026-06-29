"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Início" },
  { href: "/find-pets", label: "Buscar pets" },
  { href: "/map", label: "Mapa" },
  { href: "/post", label: "Publicar anúncio" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-xl font-bold text-primary md:text-2xl">
          PetFinder
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href
                  ? "border-b-2 border-primary pb-1 font-bold text-primary"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Link href="/login" className="hidden md:block">
            <Button variant="outline" size="sm">Entrar</Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Abrir menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/50 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-sm font-medium",
                  pathname === link.href ? "text-primary font-bold" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">Entrar</Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
