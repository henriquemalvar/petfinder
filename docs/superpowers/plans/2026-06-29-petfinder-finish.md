# PetFinder — Finalização para Portfolio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar auth state no Navbar, bell de notificações e página de perfil com edição ao PetFinder.

**Architecture:** Layout server component lê o cookie JWT, decodifica o payload para extrair o userId, busca o usuário na API Express e passa como prop ao Navbar (prop drilling nativo do App Router). NotificationBell é client component com polling de 30s. Perfil usa server component + ProfileClient (client) para o formulário.

**Tech Stack:** Next.js 15 App Router, Express 5, Prisma, shadcn/ui, Cloudinary (upload já configurado), sonner (toast já configurado).

## Global Constraints

- Monorepo raiz: `/home/henrique/dev/petfinder/`
- Web app: `apps/web/` (porta 3000)
- API: `apps/api/` (porta 3333)
- Next.js 15: `params` são `Promise<{...}>` — sempre `await params`
- Proxy routes Next.js: lê cookie com `(await cookies()).get("token")?.value`, repassa como `Authorization: Bearer`
- Sem react-hook-form — usar `useState` como padrão existente do projeto
- Commits ao final de cada task

---

### Task 1: API — Endpoints de notificações

**Files:**
- Modify: `apps/api/src/controllers/NotificationController.ts`
- Modify: `apps/api/src/routes/notification.routes.ts`

**Interfaces:**
- Produz: `GET /api/notifications` (auth) → `{ notifications: Notification[], unreadCount: number }` e `PATCH /api/notifications/:id/read` (auth) → 204

- [ ] **Step 1: Adicionar `getMyNotifications` ao NotificationController**

Substituir o conteúdo de `apps/api/src/controllers/NotificationController.ts`:

```ts
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../services/NotificationService';
import { prisma } from '../config/prisma';

export class NotificationController {
  private service: NotificationService;

  constructor() {
    this.service = new NotificationService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body as { token: string };
      await this.service.registerToken(token, req.user.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };

  notifyNearby = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.body as { postId: string };
      await this.service.notifyNearbyUsers(postId);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };

  getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      const unreadCount = notifications.filter((n) => !n.read).length;
      res.status(StatusCodes.OK).json({ notifications, unreadCount });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      await prisma.notification.updateMany({
        where: { id, userId: req.user.id },
        data: { read: true },
      });
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };
}
```

- [ ] **Step 2: Registrar as novas rotas**

Substituir o conteúdo de `apps/api/src/routes/notification.routes.ts`:

```ts
import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { registerTokenSchema, notifyNearbySchema } from '../schemas/notification.schema';

const router = Router();
const controller = new NotificationController();

router.post('/register', authMiddleware, validate(registerTokenSchema), controller.register);
router.post('/nearby', authMiddleware, validate(notifyNearbySchema), controller.notifyNearby);
router.get('/', authMiddleware, controller.getMyNotifications);
router.patch('/:id/read', authMiddleware, controller.markAsRead);

export default router;
```

- [ ] **Step 3: Verificar manualmente**

```bash
cd apps/api && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/controllers/NotificationController.ts apps/api/src/routes/notification.routes.ts
git commit -m "feat(api): endpoints GET /notifications e PATCH /notifications/:id/read"
```

---

### Task 2: Web — Auth utility + Layout + Navbar com estado de usuário

**Files:**
- Modify: `apps/web/lib/api-client.ts`
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/app/(main)/layout.tsx`
- Modify: `apps/web/components/layout/Navbar.tsx`

**Interfaces:**
- Produz: `getAuthUser(): Promise<ApiUser | null>` em `api-client.ts`
- Produz: `Navbar` aceita prop `user?: ApiUser | null`
- Consome: `ApiUser` de `lib/types.ts` (já existe)

- [ ] **Step 1: Adicionar `getAuthUser` ao api-client**

No final de `apps/web/lib/api-client.ts`, adicionar:

```ts
import type { ApiUser } from "./types";

export async function getAuthUser(): Promise<ApiUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")) as { id?: string };
    if (!payload.id) return null;
    return await apiFetch<ApiUser>(`/api/users/${payload.id}`);
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Adicionar `ApiNotification` e `NotificationsResponse` a `lib/types.ts`**

No final de `apps/web/lib/types.ts`, adicionar:

```ts
export interface ApiNotification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  postId: string;
}

export interface NotificationsResponse {
  notifications: ApiNotification[];
  unreadCount: number;
}
```

- [ ] **Step 3: Atualizar MainLayout para passar `user` ao Navbar**

Substituir `apps/web/app/(main)/layout.tsx`:

```tsx
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getAuthUser } from "@/lib/api-client";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  return (
    <>
      <Navbar user={user} />
      <main className="min-h-[calc(100vh-5rem)]">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Atualizar Navbar para mostrar estado logado**

Substituir `apps/web/components/layout/Navbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { clientLogout } from "@/lib/client-api";
import { NotificationBell } from "./NotificationBell";
import type { ApiUser } from "@/lib/types";

const links = [
  { href: "/", label: "Início" },
  { href: "/find-pets", label: "Buscar pets" },
  { href: "/map", label: "Mapa" },
  { href: "/post", label: "Publicar anúncio" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface NavbarProps {
  user?: ApiUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await clientLogout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-xl font-bold text-primary md:text-2xl">
          PetFinder
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href
                  ? "border-b-2 border-primary pb-1 font-bold text-primary"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden md:flex items-center gap-2 px-2"
                    aria-label="Menu do usuário"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold overflow-hidden">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <span className="max-w-[100px] truncate text-sm font-medium">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Meu perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login" className="hidden md:block">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Abrir menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/50 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-sm font-medium",
                  pathname === link.href
                    ? "text-primary font-bold"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Meu perfil
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive"
                  onClick={() => { setOpen(false); handleLogout(); }}
                >
                  Sair
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
```

- [ ] **Step 5: Criar NotificationBell placeholder (necessário para compilar antes da Task 3)**

Criar `apps/web/components/layout/NotificationBell.tsx`:

```tsx
"use client";

export function NotificationBell() {
  return null;
}
```

- [ ] **Step 6: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/api-client.ts apps/web/lib/types.ts apps/web/app/\(main\)/layout.tsx apps/web/components/layout/Navbar.tsx apps/web/components/layout/NotificationBell.tsx
git commit -m "feat(web): auth state no Navbar com prop drilling do layout"
```

---

### Task 3: Web — Proxy routes de notificações

**Files:**
- Create: `apps/web/app/api/notifications/route.ts`
- Create: `apps/web/app/api/notifications/[id]/read/route.ts`

**Interfaces:**
- Produz: `GET /api/notifications` → repassa para Express com Bearer
- Produz: `PATCH /api/notifications/:id/read` → repassa para Express com Bearer

- [ ] **Step 1: Criar `apps/web/app/api/notifications/route.ts`**

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const res = await fetch(`${API_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 2: Criar `apps/web/app/api/notifications/[id]/read/route.ts`**

```ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 3: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/api/notifications/
git commit -m "feat(web): proxy routes GET/PATCH de notificações"
```

---

### Task 4: Web — NotificationBell funcional

**Files:**
- Modify: `apps/web/components/layout/NotificationBell.tsx`

**Interfaces:**
- Consome: `GET /api/notifications` → `NotificationsResponse` (de `lib/types.ts`)
- Consome: `PATCH /api/notifications/:id/read`
- Consome: `timeAgo` de `@/lib/utils`
- Consome: `ApiNotification`, `NotificationsResponse` de `@/lib/types`

- [ ] **Step 1: Substituir NotificationBell pelo componente funcional**

Substituir `apps/web/components/layout/NotificationBell.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import type { ApiNotification, NotificationsResponse } from "@/lib/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: NotificationsResponse = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently ignore — usuário pode não estar logado
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleClick(notification: ApiNotification) {
    if (!notification.read) {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: "PATCH",
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n,
        ),
      );
    }
    setOpen(false);
    router.push(`/pets/${notification.postId}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-border px-4 py-3">
          <p className="font-semibold text-sm">Notificações</p>
        </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Sem notificações
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-base">🐾</span>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/layout/NotificationBell.tsx
git commit -m "feat(web): NotificationBell com polling de 30s e marcar como lida"
```

---

### Task 5: Web — Página de perfil + proxy PUT /api/users/:id

**Files:**
- Create: `apps/web/app/(main)/profile/page.tsx`
- Create: `apps/web/app/(main)/profile/ProfileClient.tsx`
- Create: `apps/web/app/api/users/[id]/route.ts`

**Interfaces:**
- Consome: `getAuthUser()` de `@/lib/api-client`
- Consome: `apiFetch` de `@/lib/api-client`
- Consome: `clientUpload` de `@/lib/client-api`
- Consome: `ApiUser`, `ApiPost`, `PostsResponse` de `@/lib/types`
- Consome: `PetCard` de `@/components/pets/PetCard`

- [ ] **Step 1: Criar proxy `PUT /api/users/:id`**

Criar `apps/web/app/api/users/[id]/route.ts`:

```ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = (await cookies()).get("token")?.value;
  const body = await request.json();
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

- [ ] **Step 2: Criar `apps/web/app/(main)/profile/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getAuthUser, apiFetch } from "@/lib/api-client";
import { ProfileClient } from "./ProfileClient";
import type { PostsResponse } from "@/lib/types";

export default async function ProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?redirect=/profile");

  const { posts } = await apiFetch<PostsResponse>(
    `/api/posts?userId=${user.id}&limit=12`,
  ).catch(() => ({ posts: [], total: 0, page: 1, limit: 12, totalPages: 0 }));

  return <ProfileClient user={user} posts={posts} />;
}
```

- [ ] **Step 3: Criar `apps/web/app/(main)/profile/ProfileClient.tsx`**

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PetCard } from "@/components/pets/PetCard";
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
          {/* Avatar */}
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

          {/* Form */}
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
                <PetCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificar compilação**

```bash
cd apps/web && npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/\(main\)/profile/ apps/web/app/api/users/
git commit -m "feat(web): página de perfil com edição de nome, contato e avatar"
```

---

## Ordem de execução

Tasks podem ser executadas sequencialmente: 1 → 2 → 3 → 4 → 5.
Task 2 cria um `NotificationBell` placeholder para compilar; Task 4 substitui pelo funcional.
