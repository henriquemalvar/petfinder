"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MyAnnouncementCard } from "@/components/pets/MyAnnouncementCard";
import { clientUpload } from "@/lib/client-api";
import type { ApiPost, ApiUser } from "@/lib/types";

interface ProfileClientProps {
  user: ApiUser;
  posts: ApiPost[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileClient({ user, posts }: ProfileClientProps) {
  const [name, setName] = useState(user.name);
  const [whatsapp, setWhatsapp] = useState(user.whatsapp ?? "");
  const [instagram, setInstagram] = useState(user.instagram ?? "");
  const [avatar, setAvatar] = useState(user.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await clientUpload(file);
      setAvatar(url);
      toast.success("Foto atualizada!");
    } catch {
      toast.error("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp, instagram, avatar }),
      });
      if (!res.ok) throw new Error();
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <h1 className="mb-8 text-2xl font-bold">Meu perfil</h1>

      <div className="grid gap-10 md:grid-cols-[280px_1fr]">
        {/* Sidebar: avatar + form */}
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold overflow-hidden">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : (
                  getInitials(name)
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                {uploading ? (
                  <span className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="text-center">
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="11999999999"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@usuario"
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </div>

        {/* Posts do usuário */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            Meus anúncios
            {posts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({posts.length})
              </span>
            )}
          </h2>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                Você ainda não publicou nenhum anúncio.
              </p>
              <a
                href="/post"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Publicar agora
              </a>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {posts.map((post) => (
                <MyAnnouncementCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
