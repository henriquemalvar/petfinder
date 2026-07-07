# PetFinder — Finalização para Portfolio

**Data:** 2026-06-29  
**Escopo:** Auth state no Navbar, Página de Perfil (view + edit), Bell de Notificações

---

## 1. Auth state no Navbar

### Problema atual
O `Navbar` é um client component que sempre mostra "Entrar", sem distinguir usuário logado.

### Solução
`MainLayout` (server component em `apps/web/app/(main)/layout.tsx`) decodifica o JWT do cookie (base64 manual, sem dependência nova) para extrair `userId`, busca `GET /api/users/:id` via `apiFetch`, e passa `user?: ApiUser` como prop ao `Navbar`.

### Navbar logado
- Avatar circular com iniciais como fallback (sem imagem)
- Nome truncado (max 20 chars)
- Dropdown (shadcn `DropdownMenu`) com:
  - "Meu perfil" → `/profile`
  - "Sair" → chama `clientLogout()` + `router.push('/')`

### Navbar deslogado
- Comportamento atual: botão "Entrar"

### Decode do JWT
```ts
function decodeJwtPayload(token: string): { id: string } | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
```
Usado apenas para extrair o ID; a verificação de assinatura é responsabilidade da API.

---

## 2. Página de Perfil `/profile`

### Arquitetura
- `apps/web/app/(main)/profile/page.tsx` — server component: lê cookie, decodifica JWT, busca usuário e posts, passa dados ao client component
- `apps/web/app/(main)/profile/ProfileClient.tsx` — client component: formulário de edição + grid de posts

O middleware já redireciona `/profile` para `/login?redirect=/profile` se sem cookie.

### Seções da página

**Header:**
- Avatar circular grande (80px) com iniciais de fallback; botão de câmera para upload
- Upload usa `clientUpload()` existente (Cloudinary via `/api/uploads`)
- Nome e email (email read-only)

**Formulário de edição:**
- Campos: nome, WhatsApp, Instagram
- Submit via `PUT /api/users/:id` (endpoint já existe na API com validação Zod)
- Feedback via `toast` (sonner já configurado)

**Posts do usuário:**
- Grid responsivo com `PetCard` existente
- Busca: `GET /api/posts?userId=:id&limit=12`
- Empty state com link para `/post`

### Nova API route (proxy Next.js)
- `apps/web/app/api/users/[id]/route.ts` — PUT: lê token do cookie, repassa como Bearer para Express

---

## 3. Bell de Notificações

### API (Express)

Adicionar em `apps/api/src/routes/notification.routes.ts`:

```
GET  /api/notifications        auth  → lista notificações do usuário (desc), inclui unreadCount
PATCH /api/notifications/:id/read  auth  → marca notificação como lida
```

`NotificationController`:
- `getMyNotifications`: busca `Notification` where `userId = req.user.id`, ordena por `createdAt desc`, retorna `{ notifications, unreadCount }`
- `markAsRead`: atualiza `read = true` where `id = req.params.id AND userId = req.user.id`

### Web (Next.js API routes proxy)
- `apps/web/app/api/notifications/route.ts` — GET
- `apps/web/app/api/notifications/[id]/read/route.ts` — PATCH

### Componente `NotificationBell`
- Client component em `apps/web/components/layout/NotificationBell.tsx`
- Busca `GET /api/notifications` ao montar; polling a cada 30s via `setInterval`
- Badge vermelho com `unreadCount` (oculto se zero)
- `Popover` (shadcn) com lista de notificações:
  - Ícone de pata, mensagem, tempo relativo (`timeAgo` já existe em `utils.ts`), link para `/pets/:postId`
  - Clicar: `PATCH /api/notifications/:id/read` + navegar para o post
- Integrado ao `Navbar` entre o toggle de tema e o avatar/login

---

## Ordem de implementação

1. Auth state no Navbar (desbloqueador — outras features dependem de ter o usuário disponível)
2. Endpoints de notificações na API
3. `NotificationBell` no Navbar
4. Página de perfil (server component + ProfileClient)
5. API route proxy `PUT /api/users/:id`

---

## Fora de escopo

- Mudança de senha
- Notificações push (WebPush/FCM) — já existe mas não é UI
- Paginação de posts no perfil
- Exclusão de conta
