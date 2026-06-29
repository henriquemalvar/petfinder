import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-container mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-primary">PetFinder</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Conectando famílias e pets, uma patinha de cada vez.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Plataforma</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">Sobre nós</Link>
              <Link href="/find-pets" className="hover:text-primary">Histórias de sucesso</Link>
              <Link href="/map" className="hover:text-primary">Mapa</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Comunidade</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/find-pets" className="hover:text-primary">Fórum</Link>
              <Link href="/post" className="hover:text-primary">Boletim</Link>
              <Link href="/post" className="hover:text-primary">Voluntariado</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Suporte</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary">Privacidade</Link>
              <Link href="#" className="hover:text-primary">Central de ajuda</Link>
              <Link href="#" className="hover:text-primary">Contato</Link>
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
