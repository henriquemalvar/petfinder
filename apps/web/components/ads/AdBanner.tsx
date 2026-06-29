interface AdBannerProps {
  title?: string;
  description?: string;
  className?: string;
}

export function AdBanner({
  title = "Cuidado premium para seu melhor amigo",
  description = "Proteja seu pet com planos a partir de R$29/mês.",
  className,
}: AdBannerProps) {
  return (
    <div
      className={`rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-info/10 p-6 md:p-8 ${className ?? ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Patrocinado</p>
      <h3 className="mt-2 text-xl font-bold text-foreground md:text-2xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
