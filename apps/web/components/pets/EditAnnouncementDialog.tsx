"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientUpload } from "@/lib/client-api";
import { UploadTooLarge } from "@/lib/image-upload";
import type { ApiPost, PetGender, PetSize, PostType } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditAnnouncementDialogProps {
  post: ApiPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: "LOST", label: "Perdido" },
  { value: "FOUND", label: "Encontrado" },
  { value: "ADOPTION", label: "Adoção" },
];

export function EditAnnouncementDialog({
  post,
  open,
  onOpenChange,
}: EditAnnouncementDialogProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [type, setType] = useState<PostType>(post.type);
  const [content, setContent] = useState(post.content);
  const [pet, setPet] = useState({
    name: post.pet.name,
    type: post.pet.type,
    breed: post.pet.breed,
    age: post.pet.age,
    gender: post.pet.gender,
    size: post.pet.size,
    image: post.pet.image ?? "",
    location: post.pet.location ?? "",
    castrated: post.pet.castrated,
    vaccinated: post.pet.vaccinated,
  });

  function setPetField<K extends keyof typeof pet>(field: K, value: (typeof pet)[K]) {
    setPet((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await clientUpload(file);
      setPetField("image", url);
      toast.success("Foto atualizada!");
    } catch (error) {
      toast.error(error instanceof UploadTooLarge ? error.message : "Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const petPayload: Record<string, unknown> = {
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        age: pet.age,
        gender: pet.gender,
        size: pet.size,
        location: pet.location,
        castrated: pet.castrated,
        vaccinated: pet.vaccinated,
      };
      // image tem validação de URL na API; só envia se houver.
      if (pet.image) petPayload.image = pet.image;

      const petRes = await fetch(`/api/pets/${post.pet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petPayload),
      });
      if (!petRes.ok) {
        const body = await petRes.json().catch(() => ({}));
        throw new Error(body.errors?.[0]?.message || body.error || "Erro ao salvar o pet");
      }

      const postRes = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content }),
      });
      if (!postRes.ok) {
        const body = await postRes.json().catch(() => ({}));
        const detail = body.errors?.[0]?.message || body.error;
        throw new Error(
          detail
            ? `Dados do pet salvos, mas o texto do anúncio falhou: ${detail}`
            : "Dados do pet salvos, mas não foi possível salvar o texto do anúncio",
        );
      }

      toast.success("Anúncio atualizado!");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const selectClass =
    "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar anúncio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-type">Tipo de anúncio</Label>
            <select
              id="edit-type"
              value={type}
              onChange={(e) => setType(e.target.value as PostType)}
              className={selectClass}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="edit-name">Nome do pet</Label>
            <Input
              id="edit-name"
              value={pet.name}
              onChange={(e) => setPetField("name", e.target.value)}
              className="mt-1 rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-species">Espécie</Label>
              <Input
                id="edit-species"
                value={pet.type}
                onChange={(e) => setPetField("type", e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="edit-breed">Raça</Label>
              <Input
                id="edit-breed"
                value={pet.breed}
                onChange={(e) => setPetField("breed", e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-age">Idade</Label>
              <Input
                id="edit-age"
                value={pet.age}
                onChange={(e) => setPetField("age", e.target.value)}
                className="mt-1 rounded-xl"
                placeholder="Ex: 2 anos"
              />
            </div>
            <div>
              <Label htmlFor="edit-gender">Sexo</Label>
              <select
                id="edit-gender"
                value={pet.gender}
                onChange={(e) => setPetField("gender", e.target.value as PetGender)}
                className={selectClass}
              >
                <option value="MALE">Macho</option>
                <option value="FEMALE">Fêmea</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-size">Porte</Label>
              <select
                id="edit-size"
                value={pet.size}
                onChange={(e) => setPetField("size", e.target.value as PetSize)}
                className={selectClass}
              >
                <option value="SMALL">Pequeno</option>
                <option value="MEDIUM">Médio</option>
                <option value="LARGE">Grande</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-location">Localização</Label>
              <Input
                id="edit-location"
                value={pet.location}
                onChange={(e) => setPetField("location", e.target.value)}
                className="mt-1 rounded-xl"
                placeholder="Ex: Vila Madalena, São Paulo"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-content">Descrição do anúncio</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 min-h-24 rounded-xl"
              placeholder="Descreva o pet, características marcantes, onde foi visto..."
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pet.vaccinated}
                onChange={(e) => setPetField("vaccinated", e.target.checked)}
              />
              Vacinado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pet.castrated}
                onChange={(e) => setPetField("castrated", e.target.checked)}
              />
              Castrado
            </label>
          </div>

          <div>
            <Label htmlFor="edit-photo" className="inline-block cursor-pointer">
              <span className="rounded-xl border border-input px-4 py-2 text-sm font-medium hover:bg-muted">
                {uploading ? "Enviando..." : pet.image ? "Trocar foto" : "Adicionar foto"}
              </span>
              <input
                id="edit-photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
