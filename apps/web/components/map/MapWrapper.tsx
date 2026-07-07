"use client";

import dynamic from "next/dynamic";
import type { ApiPost } from "@/lib/types";

const MapClient = dynamic(() => import("./MapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando mapa...</p>
      </div>
    </div>
  ),
});

interface MapWrapperProps {
  posts: ApiPost[];
  className?: string;
  interactive?: boolean;
  variant?: "default" | "hero";
  selectedPostId?: string | null;
  onSelectPost?: (post: ApiPost | null) => void;
  isDemo?: boolean;
}

export function MapWrapper({
  posts,
  className,
  interactive,
  variant,
  selectedPostId,
  onSelectPost,
  isDemo,
}: MapWrapperProps) {
  return (
    <MapClient
      posts={posts}
      className={className}
      interactive={interactive}
      variant={variant}
      selectedPostId={selectedPostId}
      onSelectPost={onSelectPost}
      isDemo={isDemo}
    />
  );
}
