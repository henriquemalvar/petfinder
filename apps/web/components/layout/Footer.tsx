import Link from "next/link";
import { PetFinderLogo } from "@/components/brand/PetFinderLogo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-container mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <PetFinderLogo size="sm" />
            <p className="mt-2 text-sm text-muted-foreground">
              Conectando famílias e pets, uma patinha de cada vez.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Plataforma</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">Início</Link>
              <Link href="/find-pets" className="hover:text-primary">Buscar pets</Link>
              <Link href="/map" className="hover:text-primary">Mapa</Link>
              <Link href="/post" className="hover:text-primary">Publicar anúncio</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Sua conta</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/profile" className="hover:text-primary">Perfil</Link>
              <Link href="/privacidade" className="hover:text-primary">Privacidade</Link>
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PetFinder. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
