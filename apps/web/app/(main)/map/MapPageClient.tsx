"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import type { ApiPost, PostType } from "@/lib/types";
import { MapWrapper } from "@/components/map/MapWrapper";
import { MapLegend } from "@/components/map/MapLegend";
import { StatusChip } from "@/components/pets/StatusChip";
import { isDemoPost } from "@/lib/mock-posts";
import { cn, POST_TYPE_LABEL, timeAgo } from "@/lib/utils";
import { PIN_CONFIG } from "@/lib/map-config";
import { PIN_ICONS } from "@/lib/map-icons";
import { Button } from "@/components/ui/button";

interface MapPageClientProps {
  initialPosts: ApiPost[];
  isDemo?: boolean;
}

const filters: { value: PostType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "LOST", label: "Perdidos" },
  { value: "FOUND", label: "Encontrados" },
  { value: "ADOPTION", label: "Adoção" },
];

export function MapPageClient({ initialPosts, isDemo = false }: MapPageClientProps) {
  const [filter, setFilter] = useState<PostType | "ALL">("ALL");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = filter === "ALL"
    ? initialPosts
    : initialPosts.filter((p) => p.type === filter);

  const withCoords = filtered.filter((p) => p.pet.latitude != null && p.pet.longitude != null);

  function handleSelectPost(post: ApiPost | null) {
    setSelectedPostId(post?.id ?? null);
    if (post && listRef.current) {
      const el = listRef.current.querySelector(`[data-post-id="${post.id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = withCoords.reduce<{ post: ApiPost; dist: number } | null>((best, post) => {
          const dist = Math.hypot(
            (post.pet.latitude! - pos.coords.latitude) * 111,
            (post.pet.longitude! - pos.coords.longitude) * 111,
          );
          if (!best || dist < best.dist) return { post, dist };
          return best;
        }, null);
        if (nearest) handleSelectPost(nearest.post);
      },
      () => undefined,
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col lg:flex-row">
      <div className="relative min-h-[55vh] flex-1">
        <MapWrapper
          posts={filtered}
          className="h-full rounded-none"
          selectedPostId={selectedPostId}
          onSelectPost={handleSelectPost}
          isDemo={isDemo}
        />
        <MapLegend />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-4 top-4 z-[1000] h-10 w-10 rounded-xl shadow-lg"
          onClick={handleLocate}
          aria-label="Alerta mais próximo"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      <aside className="flex w-full flex-col border-t border-border bg-card lg:w-[380px] lg:border-l lg:border-t-0">
        <div className="border-b border-border p-4">
          <h1 className="text-xl font-bold">Mapa de alertas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDemo ? "Dados de demonstração" : `${withCoords.length} de ${filtered.length} com localização`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setFilter(f.value);
                  setSelectedPostId(null);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  filter === f.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map((post) => {
            const image =
              post.pet.image ||
              "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=120&h=120&fit=crop";
            const isSelected = post.id === selectedPostId;
            const hasCoords = post.pet.latitude != null && post.pet.longitude != null;
            const PinIcon = PIN_ICONS[post.type];

            return (
              <button
                key={post.id}
                type="button"
                data-post-id={post.id}
                onClick={() => hasCoords && handleSelectPost(post)}
                disabled={!hasCoords}
                className={cn(
                  "flex w-full gap-3 rounded-xl border p-3 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/30"
                    : "border-border bg-background hover:border-primary/40 hover:shadow-sm",
                  !hasCoords && "opacity-50 cursor-not-allowed",
                )}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={image} alt={post.pet.name} fill className="object-cover" sizes="64px" />
                  <span
                    className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: PIN_CONFIG[post.type].color }}
                  >
                    <PinIcon className="h-2.5 w-2.5" strokeWidth={2.5} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold">{post.pet.name}</p>
                    <StatusChip type={post.type} className="shrink-0 scale-90" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {post.pet.breed} · {timeAgo(post.createdAt)}
                  </p>
                  {post.pet.location && (
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {post.pet.location}
                    </p>
                  )}
                  {isSelected && !isDemoPost(post.id) && (
                    <Link
                      href={`/pets/${post.id}`}
                      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver detalhes →
                    </Link>
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum alerta nesta categoria.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

export { POST_TYPE_LABEL };
