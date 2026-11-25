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
import { CircleCheckBig, Heart, PawPrint, Search, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  "Passo 1: Tipo de anúncio",
  "Passo 2: Informações do pet",
  "Passo 3: Enviar fotos",
  "Passo 4: Localização",
  "Passo 5: Contato e alertas",
];

const typeOptions: { value: PostType; label: string; icon: LucideIcon }[] = [
  { value: "LOST", label: "Pet perdido", icon: Search },
  { value: "FOUND", label: "Pet encontrado", icon: PawPrint },
  { value: "ADOPTION", label: "Pet para adoção", icon: Heart },
];

const PET_STEP = 1;
const LOCATION_STEP = 3;

const fieldLabels: Record<string, string> = {
  "body.type": "Tipo de anúncio",
  "body.title": "Título",
  "body.content": "Conteúdo do anúncio",
  "body.whatsapp": "WhatsApp",
  "body.instagram": "Instagram",
  "body.pet.name": "Nome do pet",
  "body.pet.type": "Espécie",
  "body.pet.breed": "Raça",
  "body.pet.age": "Idade",
  "body.pet.gender": "Sexo",
  "body.pet.size": "Porte",
  "body.pet.description": "Descrição",
  "body.pet.image": "Foto",
  "body.pet.location": "Localização",
  "body.pet.latitude": "Latitude",
  "body.pet.longitude": "Longitude",
};

const requiredPetFields = [
  { name: "name", minLength: 2, step: PET_STEP },
  { name: "type", minLength: 2, step: PET_STEP },
  { name: "breed", minLength: 2, step: PET_STEP },
  { name: "age", minLength: 1, step: PET_STEP },
  { name: "description", minLength: 10, step: PET_STEP },
  { name: "location", minLength: 2, step: LOCATION_STEP },
] as const;

function describeRequirement(field: (typeof requiredPetFields)[number]) {
  const label = fieldLabels[`body.pet.${field.name}`];
  return field.minLength > 1
    ? `${label} (mínimo ${field.minLength} caracteres)`
    : label;
}

function pendingFieldsForStep(step: number, pet: AnnouncementPayload["pet"]) {
  return requiredPetFields
    .filter((field) => field.step === step)
    .filter((field) => (pet[field.name] ?? "").trim().length < field.minLength)
    .map(describeRequirement);
}

function labelForServerField(path: string) {
  return fieldLabels[path] ?? path.split(".").pop() ?? path;
}

function messageForFailedSubmit(body: {
  error?: string;
  errors?: { field: string; message: string }[];
}) {
  if (body.errors?.length) {
    const fields = body.errors.map((issue) => labelForServerField(issue.field));
    return `Revise: ${[...new Set(fields)].join(", ")}`;
  }
  return body.error ?? "Erro ao publicar";
}

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

  const pendingFields = pendingFieldsForStep(step, form.pet);

  function goToNextStep() {
    if (pendingFields.length > 0) {
      toast.error(`Preencha: ${pendingFields.join(", ")}`);
      return;
    }
    setStep((s) => s + 1);
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
        throw new Error(messageForFailedSubmit(body));
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
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CircleCheckBig className="h-8 w-8 text-primary" />
          </div>
        </div>
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
          {typeOptions.map((opt) => {
            const Icon = opt.icon;
            return (
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
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold">{opt.label}</p>
            </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do pet <span className="text-destructive">*</span></Label>
            <Input id="name" value={form.pet.name} onChange={(e) => updatePet("name", e.target.value)} className="mt-1 rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="type">Espécie <span className="text-destructive">*</span></Label>
              <Input id="type" value={form.pet.type} onChange={(e) => updatePet("type", e.target.value)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="breed">Raça <span className="text-destructive">*</span></Label>
              <Input id="breed" value={form.pet.breed} onChange={(e) => updatePet("breed", e.target.value)} className="mt-1 rounded-xl" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="age">Idade <span className="text-destructive">*</span></Label>
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
            <Label htmlFor="description">Descrição <span className="text-destructive">*</span></Label>
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
              // eslint-disable-next-line @next/next/no-img-element -- preview local (blob/data URL), next/image não otimiza
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
            <Label htmlFor="location">Localização / Bairro <span className="text-destructive">*</span></Label>
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
          <Button className="rounded-xl" onClick={goToNextStep}>
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
