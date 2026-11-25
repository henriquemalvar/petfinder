"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Pencil,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { ApiPost } from "@/lib/types";
import { cn, POST_TYPE_COLORS, POST_TYPE_LABEL, timeAgo } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditAnnouncementDialog } from "./EditAnnouncementDialog";

interface MyAnnouncementCardProps {
  post: ApiPost;
}

export function MyAnnouncementCard({ post }: MyAnnouncementCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const image =
    post.pet.image ||
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=400&fit=crop";
  const resolved = post.status === "RESOLVED";

  async function setStatus(status: "RESOLVED" | "ACTIVE") {
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "RESOLVED" ? "Anúncio marcado como resolvido!" : "Anúncio reaberto!");
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar o anúncio");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      toast.success("Anúncio excluído");
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("Não foi possível excluir o anúncio");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden border-border/60 transition-all",
          resolved && "opacity-60",
        )}
      >
        <Link href={`/pets/${post.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={image}
              alt={post.pet.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width:768px) 100vw, 33vw"
            />
            <div className="absolute inset-x-0 bottom-0 pet-card-image-gradient p-4">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  POST_TYPE_COLORS[post.type],
                )}
              >
                {POST_TYPE_LABEL[post.type]}
              </span>
            </div>
            {resolved && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-xs font-semibold text-white shadow">
                <CheckCircle2 className="h-3 w-3" /> Resolvido
              </span>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-foreground">{post.pet.name}</h3>
            <p className="text-sm text-muted-foreground">
              {post.pet.breed} · {post.pet.age}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>

        {/* Menu de ações do dono, irmão do Link para não disparar navegação. */}
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Ações do anúncio"
              disabled={busy}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur hover:bg-background disabled:opacity-50"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              {resolved ? (
                <DropdownMenuItem onSelect={() => setStatus("ACTIVE")}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reabrir anúncio
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setStatus("RESOLVED")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como resolvido
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {editOpen && (
        <EditAnnouncementDialog post={post} open onOpenChange={setEditOpen} />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O anúncio de {post.pet.name} e seus
              avistamentos serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={busy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
