# Login social com Google — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar "Entrar com Google" nas páginas de login e registro do PetFinder, reaproveitando o sistema de JWT/cookie `token` já existente (sem introduzir uma segunda sessão paralela).

**Architecture:** Google Identity Services (GSI) no front devolve um `id_token` assinado direto no navegador. O front manda esse token pro proxy Next `/api/auth/google`, que repassa pro Express. O Express valida o token com `google-auth-library`, faz find-or-create do usuário por email, e devolve `{ user, token }` no mesmo formato do login/registro atuais. O proxy seta o mesmo cookie `token` httpOnly de sempre — middleware, `api-client.ts` e demais proxies não mudam.

**Tech Stack:** Next.js 15 (App Router) + Express 5 + Prisma + `google-auth-library` (novo, só no backend) + script oficial `accounts.google.com/gsi/client` (novo, só no front, sem dependência npm).

## Global Constraints

- Spec de referência: `docs/superpowers/specs/2026-07-05-google-social-login-design.md`
- Account linking: se o email do Google já existir como conta email/senha, vincula automaticamente (seta `googleId` na conta existente), sem bloqueio.
- Rejeitar login se `email_verified` for `false` no payload do Google.
- Botão "Entrar com Google" aparece tanto em `/login` quanto em `/register`.
- **Este projeto não tem suíte de testes automatizados** (`apps/api/package.json` tem `"test": "echo ... && exit 1"`, zero arquivos `.test.ts`/`.spec.ts` no repo). Seguindo o padrão já estabelecido no projeto, a verificação de cada task usa `npx tsc --noEmit` (checagem de tipos) e testes manuais via `curl`/navegador — não introduzir um framework de testes novo como parte desta feature, isso está fora de escopo.
- Cookie `token`: `httpOnly`, `sameSite: "lax"`, `path: "/"`, `maxAge: 60 * 60 * 24 * 7` — igual ao login atual, não mudar.

---

### Task 1: Schema Prisma — password opcional + googleId

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

**Interfaces:**
- Produces: `User.password` agora `String?` (nullable), `User.googleId` novo campo `String? @unique` — tasks seguintes (2, 3) dependem desses dois campos existirem no client gerado do Prisma.

- [ ] **Step 1: Editar o model User no schema**

Em `apps/api/prisma/schema.prisma`, dentro do `model User`, altere a linha `password` e adicione `googleId` logo abaixo:

```prisma
model User {
  id                String              @id @default(uuid())
  name              String
  email             String              @unique
  password          String?
  googleId          String?             @unique
  avatar            String?
  whatsapp          String?
  instagram         String?
  contactPreference String?
  address           String?
  latitude          Float?
  longitude         Float?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  pets              Pet[]
  posts             Post[]
  comments          Comment[]
  tokens            NotificationToken[]
  notifications     Notification[]
}
```

- [ ] **Step 2: Gerar e aplicar a migration**

Run (dentro de `apps/api`):
```bash
npx prisma migrate dev --name add_google_auth
```
Expected: output terminando em `Your database is now in sync with your schema.` e um novo diretório `prisma/migrations/<timestamp>_add_google_auth/migration.sql` criado, com `ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;` e `ALTER TABLE "User" ADD COLUMN "googleId" TEXT; CREATE UNIQUE INDEX ...` (nomes exatos podem variar, mas devem conter essas duas alterações).

- [ ] **Step 3: Verificar que o client do Prisma foi regenerado com os novos campos**

Run:
```bash
grep -n "googleId" apps/api/node_modules/.prisma/client/index.d.ts | head -3
```
Expected: pelo menos uma ocorrência de `googleId` no tipo `User` gerado (confirma que `prisma generate` rodou como parte do `migrate dev`).

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): add nullable password and googleId to User model"
```

---

### Task 2: Backend — tipos + config do Google + AuthService

**Files:**
- Modify: `apps/api/src/types/index.ts`
- Create: `apps/api/src/config/google.ts`
- Modify: `apps/api/src/services/AuthService.ts`

**Interfaces:**
- Consumes: `User.password: string | null` e `User.googleId: string | null` do Prisma client (Task 1); `UserRepository.findByEmail(email): Promise<User | null>`, `UserRepository.create(data: CreateUserDTO): Promise<User>`, `UserRepository.update(id, data: UpdateUserDTO): Promise<User>` (já existentes, sem mudança de assinatura).
- Produces: `AuthService.authenticateWithGoogle(credential: string): Promise<{ user: UserResponse; token: string }>` — Task 3 (controller) chama esse método exatamente com esse nome e assinatura.

- [ ] **Step 1: Atualizar os tipos em `apps/api/src/types/index.ts`**

Altere o `export type User` (linhas 3-21) trocando `password: string;` por `password: string | null;` e adicionando `googleId: string | null;`:

```ts
export type User = {
  id: string;
  name: string;
  email: string;
  password: string | null;
  googleId: string | null;
  avatar: string | null;
  whatsapp: string | null;
  instagram: string | null;
  contactPreference: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
  pets?: Pet[];
  posts?: Post[];
  tokens?: NotificationToken[];
  notifications?: Notification[];
};
```

Altere `CreateUserDTO` (linhas 67-78) tornando `password` opcional e adicionando `googleId`:

```ts
export interface CreateUserDTO {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  whatsapp?: string;
  instagram?: string;
  contactPreference?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}
```

Altere `UpdateUserDTO` (linhas 107-118) adicionando `googleId`:

```ts
export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  whatsapp?: string;
  instagram?: string;
  contactPreference?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}
```

- [ ] **Step 2: Instalar a dependência `google-auth-library`**

Run (dentro de `apps/api`):
```bash
npm install google-auth-library
```
Expected: `apps/api/package.json` ganha `"google-auth-library": "^9.x.x"` em `dependencies` (versão exata decidida pelo npm).

- [ ] **Step 3: Criar `apps/api/src/config/google.ts`**

```ts
import { OAuth2Client } from 'google-auth-library';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
```

Nota: a validação de `GOOGLE_CLIENT_ID` vazio acontece dentro de `authenticateWithGoogle` (Step 5), não no import deste módulo — assim o servidor continua subindo normalmente em ambientes de dev que ainda não configuraram as credenciais do Google, e o erro só aparece quando alguém de fato tenta usar o login social.

- [ ] **Step 4: Corrigir `AuthService.authenticate` para senha nula**

Em `apps/api/src/services/AuthService.ts`, dentro de `authenticate`, troque:

```ts
      if (!user) {
        throw new AppError('Email ou senha inválidos', StatusCodes.UNAUTHORIZED);
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
```

por:

```ts
      if (!user || !user.password) {
        throw new AppError('Email ou senha inválidos', StatusCodes.UNAUTHORIZED);
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
```

Isso é necessário porque, a partir da Task 1, contas criadas via Google não têm senha (`password: null`) — sem essa checagem, `bcrypt.compare` receberia `null` e quebraria com erro genérico em vez da mensagem correta de "Email ou senha inválidos".

- [ ] **Step 5: Corrigir `AuthService.register` para o novo tipo de `CreateUserDTO.password`**

Como `CreateUserDTO.password` virou opcional no Step 1 (necessário pra `authenticateWithGoogle` poder criar usuário sem senha), o `register` atual quebra a checagem de tipos, porque `bcrypt.hash(data.password, 10)` exige `string`, não `string | undefined`. Em `apps/api/src/services/AuthService.ts`, dentro de `register`, troque:

```ts
      if (userExists) {
        throw new AppError('Email já está em uso', StatusCodes.CONFLICT);
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
```

por:

```ts
      if (userExists) {
        throw new AppError('Email já está em uso', StatusCodes.CONFLICT);
      }

      if (!data.password) {
        throw new AppError('Senha é obrigatória', StatusCodes.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
```

Isso não muda o comportamento em runtime (o `registerSchema` via Zod já exige `password` nesse endpoint), só corrige o tipo e adiciona uma proteção explícita.

- [ ] **Step 6: Adicionar `authenticateWithGoogle` em `AuthService`**

No topo do arquivo, adicione o import:
```ts
import { GOOGLE_CLIENT_ID, googleClient } from '../config/google';
```

Dentro da classe `AuthService`, adicione o método (depois de `register`):

```ts
  async authenticateWithGoogle(credential: string) {
    if (!GOOGLE_CLIENT_ID) {
      throw new AppError('Login com Google não configurado no servidor', StatusCodes.INTERNAL_SERVER_ERROR);
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch {
      throw new AppError('Token do Google inválido', StatusCodes.UNAUTHORIZED);
    }

    if (!payload || !payload.email) {
      throw new AppError('Token do Google inválido', StatusCodes.UNAUTHORIZED);
    }

    if (!payload.email_verified) {
      throw new AppError('Email do Google não verificado', StatusCodes.UNAUTHORIZED);
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await this.repository.findByEmail(email);

    if (!user) {
      user = await this.repository.create({
        name: name || email,
        email,
        googleId,
        avatar: picture
      });
    } else if (!user.googleId) {
      user = await this.repository.update(user.id, { googleId });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      token
    };
  }
```

- [ ] **Step 7: Checar tipos**

Run (dentro de `apps/api`):
```bash
npx tsc --noEmit
```
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/types/index.ts apps/api/src/config/google.ts apps/api/src/services/AuthService.ts apps/api/package.json apps/api/package-lock.json
git commit -m "feat(api): add Google id_token authentication to AuthService"
```

---

### Task 3: Backend — controller, schema de validação e rota

**Files:**
- Modify: `apps/api/src/controllers/AuthController.ts`
- Modify: `apps/api/src/schemas/auth.schema.ts`
- Modify: `apps/api/src/routes/auth.routes.ts`
- Modify: `apps/api/.env.example`

**Interfaces:**
- Consumes: `AuthService.authenticateWithGoogle(credential: string)` (Task 2).
- Produces: rota `POST /api/auth/google` respondendo `{ user, token }` (200) ou `{ error: string }` (400/401/500) — Task 5 (proxy Next.js) chama exatamente essa rota.

- [ ] **Step 1: Adicionar `googleLoginSchema` em `apps/api/src/schemas/auth.schema.ts`**

```ts
export const googleLoginSchema = z.object({
  body: z.object({
    credential: z.string().min(1, 'Credential do Google é obrigatório')
  })
});
```

- [ ] **Step 2: Adicionar `googleLogin` em `AuthController`**

Em `apps/api/src/controllers/AuthController.ts`, adicione o método (depois de `register`):

```ts
  googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { credential } = req.body;
      const result = await this.authService.authenticateWithGoogle(credential);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  };
```

- [ ] **Step 3: Adicionar a rota em `apps/api/src/routes/auth.routes.ts`**

Adicione o import de `googleLoginSchema` junto ao import existente de `loginSchema, registerSchema`, e adicione a rota antes do `export default router;`:

```ts
/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     tags:
 *       - Autenticação
 *     summary: Login/registro via Google
 *     description: Autentica um usuário usando um id_token do Google Identity Services. Cria a conta automaticamente se o email ainda não existir.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: id_token retornado pelo Google Identity Services
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token do Google inválido ou email não verificado
 */
router.post('/google', validate(googleLoginSchema), authController.googleLogin as RequestHandler);
```

- [ ] **Step 4: Adicionar `GOOGLE_CLIENT_ID` em `apps/api/.env.example`**

Adicione ao final do arquivo:
```
# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id_aqui
```

- [ ] **Step 5: Checar tipos**

Run (dentro de `apps/api`):
```bash
npx tsc --noEmit
```
Expected: sem erros.

- [ ] **Step 6: Testar manualmente o caminho de erro (sem precisar de credenciais reais do Google)**

Suba a API (`npm run dev` dentro de `apps/api`, em outro terminal) e rode:
```bash
curl -s -X POST http://localhost:3333/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential":"token-invalido"}'
```
Expected: `{"error":"Token do Google inválido"}` (ou, se `GOOGLE_CLIENT_ID` ainda não estiver setado no `.env`, `{"error":"Login com Google não configurado no servidor"}` — ambos confirmam que a rota está encadeada corretamente).

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/controllers/AuthController.ts apps/api/src/schemas/auth.schema.ts apps/api/src/routes/auth.routes.ts apps/api/.env.example
git commit -m "feat(api): wire up POST /api/auth/google endpoint"
```

---

### Task 4: Obter credenciais OAuth do Google (passo manual do usuário)

Esta task não tem código — é um checkpoint pra conseguir o `Client ID` real antes de testar o fluxo completo nas Tasks 5 e 6.

- [ ] **Step 1: Pedir ao usuário para criar as credenciais**

Peça pro usuário:
1. Acessar https://console.cloud.google.com/apis/credentials
2. Criar (ou selecionar) um projeto
3. "Create Credentials" → "OAuth client ID" → tipo "Web application"
4. Em "Authorized JavaScript origins", adicionar `http://localhost:3000`
5. Copiar o "Client ID" gerado (não precisa do "Client secret" — o fluxo GSI usado aqui não usa secret)

- [ ] **Step 2: Adicionar o Client ID nos dois `.env`**

Com o valor em mãos, adicione:

Em `apps/api/.env`:
```
GOOGLE_CLIENT_ID=<client_id_fornecido_pelo_usuario>
```

Em `apps/web/.env.local`:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<mesmo_client_id>
```

- [ ] **Step 3: Reiniciar a API pra carregar a nova env var**

Se a API estiver rodando via `npm run dev`, reinicie o processo pra `dotenv.config()` recarregar o `.env` com o `GOOGLE_CLIENT_ID` novo.

Não há commit nesta task (arquivos `.env*` reais são ignorados pelo git).

---

### Task 5: Frontend — proxy Next.js e função de cliente

**Files:**
- Create: `apps/web/app/api/auth/google/route.ts`
- Modify: `apps/web/lib/client-api.ts`

**Interfaces:**
- Consumes: `POST http://localhost:3333/api/auth/google` (Task 3), formato `{ user, token }` em caso de sucesso.
- Produces: `clientGoogleLogin(credential: string): Promise<AuthResponse>` — Task 6 (componente `GoogleSignInButton`) importa e chama exatamente essa função.

- [ ] **Step 1: Criar o proxy `apps/web/app/api/auth/google/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${API_URL}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  const response = NextResponse.json(data);
  response.cookies.set("token", data.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
```

- [ ] **Step 2: Adicionar `clientGoogleLogin` em `apps/web/lib/client-api.ts`**

Adicione a função (depois de `clientRegister`):

```ts
export async function clientGoogleLogin(credential: string) {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao entrar com Google");
  }
  return res.json() as Promise<AuthResponse>;
}
```

- [ ] **Step 3: Checar tipos**

Run (dentro de `apps/web`):
```bash
npx tsc --noEmit
```
Expected: sem erros.

- [ ] **Step 4: Testar o proxy manualmente**

Com a API e o Next.js rodando (`npm run dev` em ambos), rode:
```bash
curl -s -i -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential":"token-invalido"}'
```
Expected: status `401` (ou `500` se `GOOGLE_CLIENT_ID` ainda não configurado) e corpo `{"error":"..."}` — confirma que o proxy repassa erro corretamente sem setar cookie.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/auth/google/route.ts apps/web/lib/client-api.ts
git commit -m "feat(web): add Google login proxy route and client helper"
```

---

### Task 6: Frontend — componente GoogleSignInButton + páginas de login/registro

**Files:**
- Create: `apps/web/components/auth/GoogleSignInButton.tsx`
- Modify: `apps/web/app/login/page.tsx`
- Modify: `apps/web/app/register/page.tsx`

**Interfaces:**
- Consumes: `clientGoogleLogin(credential: string): Promise<AuthResponse>` (Task 5); `Separator` de `@/components/ui/separator` (já existente no projeto).
- Produces: `GoogleSignInButton({ redirect }: { redirect?: string })` — componente final, consumido pelas páginas de login e registro desta mesma task.

- [ ] **Step 1: Criar `apps/web/components/auth/GoogleSignInButton.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientGoogleLogin } from "@/lib/client-api";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string }
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  redirect?: string;
}

export function GoogleSignInButton({ redirect }: GoogleSignInButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  async function handleCredential(response: GoogleCredentialResponse) {
    try {
      await clientGoogleLogin(response.credential);
      toast.success("Entrada realizada!");
      router.push(redirect || "/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar com Google");
    }
  }

  function renderGoogleButton() {
    if (!window.google || !buttonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      callback: handleCredential,
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 328,
      text: "continue_with",
    });
  }

  useEffect(() => {
    if (window.google) renderGoogleButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={renderGoogleButton}
      />
      <div ref={buttonRef} className="flex justify-center" />
    </>
  );
}
```

- [ ] **Step 2: Adicionar o botão em `apps/web/app/login/page.tsx`**

Adicione o import no topo:
```ts
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Separator } from "@/components/ui/separator";
```

Dentro de `LoginForm`, logo depois do `</form>` e antes do `<p className="mt-6 ...">`, adicione:

```tsx
        <div className="mt-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>
        <div className="mt-4">
          <GoogleSignInButton redirect={searchParams.get("redirect") || undefined} />
        </div>
```

- [ ] **Step 3: Adicionar o botão em `apps/web/app/register/page.tsx`**

Adicione o import no topo:
```ts
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Separator } from "@/components/ui/separator";
```

Dentro do componente, logo depois do `</form>` e antes do `<p className="mt-6 ...">`, adicione:

```tsx
        <div className="mt-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>
        <div className="mt-4">
          <GoogleSignInButton />
        </div>
```

- [ ] **Step 4: Checar tipos**

Run (dentro de `apps/web`):
```bash
npx tsc --noEmit
```
Expected: sem erros.

- [ ] **Step 5: Verificar visualmente e testar o fluxo completo no navegador**

Com a API e o Next.js rodando, e `GOOGLE_CLIENT_ID`/`NEXT_PUBLIC_GOOGLE_CLIENT_ID` configurados (Task 4):
1. Abrir `http://localhost:3000/login`
2. Confirmar que o botão "Sign in with Google" aparece abaixo do separador "ou"
3. Clicar no botão, completar o login com uma conta Google real
4. Confirmar redirecionamento pra `/` com o Navbar mostrando o usuário autenticado (avatar/nome)
5. Fazer logout, repetir o mesmo teste em `/register`
6. Verificar no banco (`npx prisma studio` dentro de `apps/api`, ou uma query) que o usuário foi criado com `googleId` preenchido e `password: null`

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/auth/GoogleSignInButton.tsx apps/web/app/login/page.tsx apps/web/app/register/page.tsx
git commit -m "feat(web): add Google sign-in button to login and register pages"
```
