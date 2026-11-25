"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Share2, MapPin, CheckCircle2 } from "lucide-react";
import type { ApiComment, ApiPost } from "@/lib/types";
import { formatDate, POST_TYPE_LABEL } from "@/lib/utils";
import { StatusChip } from "@/components/pets/StatusChip";
import { ContactActions } from "@/components/pets/ContactActions";
import { MapWrapper } from "@/components/map/MapWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PetDetailClientProps {
  post: ApiPost;
  initialComments: ApiComment[];
}

export function PetDetailClient({ post, initialComments }: PetDetailClientProps) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const image = post.pet.image || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=600&fit=crop";
  const inactive = post.status !== "ACTIVE";
  const resolvedBanner =
    post.status === "RESOLVED"
      ? "Este caso foi resolvido. O anúncio não está mais ativo."
      : "Este anúncio foi encerrado e não está mais ativo.";

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      const comment = await res.json();
      setComments((prev) => [comment, ...prev]);
      setText("");
      toast.success("Comentário publicado!");
    } catch {
      toast.error("Faça login para comentar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  }

  return (
    <div className="page-container py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl">
          <Image src={image} alt={post.pet.name} fill className="object-cover" priority />
        </div>

        <div>
          {inactive && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {resolvedBanner}
            </div>
          )}
          <StatusChip type={post.type} pulse={!inactive && post.type === "LOST"} />
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">{post.pet.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {post.pet.breed} · {post.pet.age} · {POST_TYPE_LABEL[post.type]}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Publicado em {formatDate(post.createdAt)}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {post.pet.vaccinated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-3 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3 w-3" /> Vacinado
              </span>
            )}
            {post.pet.castrated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-info/20 px-3 py-1 text-xs font-medium text-info">
                <CheckCircle2 className="h-3 w-3" /> Castrado
              </span>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {!inactive && (
              <ContactActions
                whatsapp={post.user.whatsapp}
                instagram={post.user.instagram}
                contactPreference={post.user.contactPreference}
              />
            )}
            <Button variant="outline" className="rounded-xl" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Sobre {post.pet.name}</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">{post.content}</p>
      </section>

      {post.pet.latitude && post.pet.longitude && (
        <section className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <MapPin className="h-5 w-5 text-primary" />
            Última localização vista
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">{post.pet.location}</p>
          <div className="h-64 overflow-hidden rounded-2xl md:h-80">
            <MapWrapper posts={[post]} />
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-bold">Avistamentos da comunidade ({comments.length})</h2>
        {!inactive && (
          <form onSubmit={handleComment} className="mt-4 flex gap-2">
            <Input
              placeholder="Reporte um avistamento..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="rounded-xl"
            />
            <Button type="submit" disabled={submitting} className="rounded-xl shrink-0">
              Enviar
            </Button>
          </form>
        )}
        <div className="mt-6 space-y-4">
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{comment.user.name}</p>
                <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{comment.text}</p>
            </article>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum avistamento ainda. Seja o primeiro!</p>
          )}
        </div>
      </section>

      <div className="mt-8">
        <Link href="/find-pets">
          <Button variant="outline" className="rounded-xl">← Voltar para lista</Button>
        </Link>
      </div>
    </div>
  );
}
