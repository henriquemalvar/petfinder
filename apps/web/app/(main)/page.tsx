import Link from "next/link";
import { ArrowRight, MapPin, Heart, Search } from "lucide-react";
import { getPosts } from "@/lib/api-client";
import { PetCard } from "@/components/pets/PetCard";
import { MapWrapper } from "@/components/map/MapWrapper";
import { AdBanner } from "@/components/ads/AdBanner";
import { Button } from "@/components/ui/button";

const features = [
  { icon: "🛡️", title: "Privacidade", description: "Seus dados de contato são protegidos e compartilhados apenas quando você autoriza." },
  { icon: "⚡", title: "Velocidade", description: "Alertas em tempo real para pets perdidos na sua região." },
  { icon: "🤝", title: "Comunidade", description: "Milhares de voluntários prontos para ajudar a reunir famílias." },
  { icon: "📍", title: "Mapa inteligente", description: "Visualize todos os alertas próximos em um mapa interativo." },
];

export default async function HomePage() {
  let nearbyPosts: Awaited<ReturnType<typeof getPosts>>["posts"] = [];
  try {
    const data = await getPosts({ limit: 6, status: "ACTIVE" });
    nearbyPosts = data.posts;
  } catch {
    nearbyPosts = [];
  }

  return (
    <div>
      <section className="relative min-h-[520px] overflow-hidden md:min-h-[600px]">
        <div className="absolute inset-0">
          <MapWrapper
            posts={nearbyPosts}
            className="h-full w-full rounded-none"
            interactive={false}
            variant="hero"
          />
        </div>
        <div id="hero-tour-overlays" className="pointer-events-none absolute inset-0 z-[5]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="hero-card max-w-2xl rounded-2xl p-8 md:p-10">
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              Reunindo famílias,{" "}
              <span className="text-primary">uma patinha de cada vez.</span>
            </h1>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Reporte pets perdidos, encontre achados e conecte-se com adoções na sua comunidade.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/map">
                <Button size="lg" className="rounded-xl">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar no mapa
                </Button>
              </Link>
              <Link href="/post">
                <Button size="lg" variant="outline" className="rounded-xl">
                  Publicar anúncio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/post?type=LOST" className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20 text-2xl">🔍</div>
            <h3 className="text-lg font-semibold">Perdeu um pet?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Publique um alerta e mobilize a comunidade.</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Reportar pet perdido <ArrowRight className="ml-1 h-4 w-4" />
            </span>
          </Link>
          <Link href="/post?type=FOUND" className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-2xl">🐾</div>
            <h3 className="text-lg font-semibold">Encontrou um pet?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Ajude a reunir o pet com a família dele.</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Publicar achado <ArrowRight className="ml-1 h-4 w-4" />
            </span>
          </Link>
          <Link href="/find-pets?type=ADOPTION" className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-tertiary/20 text-2xl">
              <Heart className="h-6 w-6 text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold">Quer adotar?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Explore pets disponíveis para adoção.</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Ver adoções <ArrowRight className="ml-1 h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Alertas próximos</h2>
          <Link href="/map" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
            <MapPin className="mr-1 h-4 w-4" />
            Ver todos no mapa
          </Link>
        </div>
        {nearbyPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyPosts.map((post) => (
              <PetCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">Nenhum alerta no momento. Seja o primeiro a publicar!</p>
            <Link href="/post" className="mt-4 inline-block">
              <Button>Publicar anúncio</Button>
            </Link>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <AdBanner />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <h2 className="mb-2 text-2xl font-bold md:text-3xl">
          Mais que um app. Uma <span className="text-secondary">comunidade</span> de cuidado.
        </h2>
        <p className="mb-8 text-muted-foreground">Recursos pensados para quem ama pets.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article key={feature.title} className="flex gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
