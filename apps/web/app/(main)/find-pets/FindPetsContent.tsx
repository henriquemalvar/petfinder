"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ApiPost, PostType } from "@/lib/types";
import { API_URL, buildQuery } from "@/lib/utils";
import { PetCard } from "@/components/pets/PetCard";
import { SearchFilterBar } from "@/components/pets/SearchFilterBar";
import { Button } from "@/components/ui/button";

export default function FindPetsPage() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") as PostType | null) ?? "ALL";

  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [activeFilter, setActiveFilter] = useState<PostType | "ALL">(initialType);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        limit: 9,
        status: "ACTIVE",
        search: search || undefined,
        type: activeFilter === "ALL" ? undefined : activeFilter,
      };
      const res = await fetch(`${API_URL}/api/posts${buildQuery(params)}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchPosts, 300);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, search]);

  return (
    <div className="page-container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pets disponíveis perto de você</h1>
        <p className="mt-2 text-muted-foreground">Explore alertas de perdidos, achados e adoções.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <SearchFilterBar
            active={activeFilter}
            onChange={setActiveFilter}
            search={search}
            onSearchChange={setSearch}
          />
        </aside>

        <div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <PetCard key={post.id} post={post} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">Nenhum pet encontrado com esses filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
