"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { AnnouncementPayload, PetGender, PetSize, PostType } from "@/lib/types";
import { StepProgress } from "@/components/post/StepProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const STEPS = [
  "Passo 1: Tipo de anúncio",
  "Passo 2: Informações do pet",
  "Passo 3: Enviar fotos",
  "Passo 4: Localização",
  "Passo 5: Contato e alertas",
];

const typeOptions: { value: PostType; label: string; emoji: string }[] = [
  { value: "LOST", label: "Pet perdido", emoji: "🔍" },
  { value: "FOUND", label: "Pet encontrado", emoji: "🐾" },
  { value: "ADOPTION", label: "Pet para adoção", emoji: "❤️" },
];

function PostWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<AnnouncementPayload>({
    type: (searchParams.get("type") as PostType) || "LOST",
    pet: {
      name: "",
      type: "Cachorro",
      breed: "",
      age: "",
      gender: "MALE",
      size: "MEDIUM",
      description: "",
      castrated: false,
      vaccinated: false,
      location: "",
    },
    whatsapp: "",
    contactPreference: "WHATSAPP",
    sharePhonePublicly: true,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function updatePet(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, pet: { ...prev.pet, [field]: value } }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      updatePet("image", url);
      toast.success("Foto enviada!");
    } catch {
      toast.error("Erro no upload. Continue sem foto ou tente novamente.");
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erro ao publicar");
      }
      setDone(true);
      toast.success("Anúncio publicado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao publicar");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-primary">Anúncio publicado!</h1>
        <p className="mt-4 text-muted-foreground">Seu anúncio já está visível para a comunidade.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => router.push("/find-pets")} className="rounded-xl">
            Ver anúncios
          </Button>
          <Button variant="outline" onClick={() => router.push("/")} className="rounded-xl">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <StepProgress currentStep={step + 1} label={STEPS[step]} />

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: opt.value }))}
              className={`rounded-2xl border-2 p-6 text-center transition-all ${
                form.type === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-4xl">{opt.emoji}</div>
              <p className="mt-2 font-semibold">{opt.label}</p>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do pet</Label>
            <Input id="name" value={form.pet.name} onChange={(e) => updatePet("name", e.target.value)} className="mt-1 rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="type">Espécie</Label>
              <Input id="type" value={form.pet.type} onChange={(e) => updatePet("type", e.target.value)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="breed">Raça</Label>
              <Input id="breed" value={form.pet.breed} onChange={(e) => updatePet("breed", e.target.value)} className="mt-1 rounded-xl" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="age">Idade</Label>
              <Input id="age" value={form.pet.age} onChange={(e) => updatePet("age", e.target.value)} className="mt-1 rounded-xl" placeholder="Ex: 2 anos" />
            </div>
            <div>
              <Label htmlFor="gender">Sexo</Label>
              <select
                id="gender"
                value={form.pet.gender}
                onChange={(e) => updatePet("gender", e.target.value as PetGender)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="MALE">Macho</option>
                <option value="FEMALE">Fêmea</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="size">Porte</Label>
            <select
              id="size"
              value={form.pet.size}
              onChange={(e) => updatePet("size", e.target.value as PetSize)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="SMALL">Pequeno</option>
              <option value="MEDIUM">Médio</option>
              <option value="LARGE">Grande</option>
            </select>
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={form.pet.description}
              onChange={(e) => updatePet("description", e.target.value)}
              className="mt-1 rounded-xl min-h-24"
              placeholder="Descreva o pet, características marcantes..."
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.pet.vaccinated} onChange={(e) => updatePet("vaccinated", e.target.checked)} />
              Vacinado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.pet.castrated} onChange={(e) => updatePet("castrated", e.target.checked)} />
              Castrado
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="text-center">
          <div className="mx-auto flex h-48 w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted">
            {imagePreview ? (
              <img src={imagePreview} alt="Prévia" className="h-full w-full object-cover" />
            ) : (
              <p className="text-sm text-muted-foreground">Arraste ou selecione uma foto</p>
            )}
          </div>
          <Label htmlFor="photo" className="mt-4 inline-block cursor-pointer">
            <span className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
              Selecionar foto
            </span>
            <input id="photo" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </Label>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="location">Localização / Bairro</Label>
            <Input
              id="location"
              value={form.pet.location}
              onChange={(e) => updatePet("location", e.target.value)}
              className="mt-1 rounded-xl"
              placeholder="Ex: Vila Madalena, São Paulo"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lat">Latitude (opcional)</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={form.pet.latitude ?? ""}
                onChange={(e) => updatePet("latitude", e.target.value ? parseFloat(e.target.value) : undefined)}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="lng">Longitude (opcional)</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={form.pet.longitude ?? ""}
                onChange={(e) => updatePet("longitude", e.target.value ? parseFloat(e.target.value) : undefined)}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={form.whatsapp ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
              className="mt-1 rounded-xl"
              placeholder="+55 11 99999-9999"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.sharePhonePublicly ?? true}
              onChange={(e) => setForm((prev) => ({ ...prev, sharePhonePublicly: e.target.checked }))}
            />
            Compartilhar meu telefone publicamente
          </label>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="rounded-xl" onClick={() => setStep((s) => s + 1)}>
            Próximo passo
          </Button>
        ) : (
          <Button className="rounded-xl" onClick={handleSubmit} disabled={loading}>
            {loading ? "Publicando..." : "Publicar anúncio"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PostPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-8 h-96 animate-pulse bg-muted rounded-2xl" />}>
      <PostWizardContent />
    </Suspense>
  );
}
