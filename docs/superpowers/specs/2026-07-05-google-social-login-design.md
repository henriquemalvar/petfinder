# Login social com Google — Design

## Contexto

O PetFinder hoje tem autenticação própria: Express emite um JWT (payload `{ id }`) no login/registro, e o Next.js atua como proxy fino, guardando esse JWT num cookie `httpOnly` chamado `token`. Middleware e todos os componentes que precisam do usuário logado (`lib/api-client.ts`, proxies de API, `middleware.ts`) leem esse cookie diretamente — não existe hoje nenhum conceito de "sessão" separado do JWT do Express.

Objetivo: adicionar "Entrar com Google" no login e no registro, sem introduzir um segundo sistema de sessão paralelo.

## Abordagem escolhida

**Google Identity Services (GSI)** no front + Express valida o `id_token` recebido.

Alternativas descartadas:
- **NextAuth v5**: gerencia sua própria sessão/cookie, exigiria migrar todos os consumidores do cookie `token` atual pra sessão do NextAuth (refactor amplo) ou rodar dois sistemas de auth em paralelo (confuso).
- **OAuth 2.0 Authorization Code flow manual**: mais controle, mas replica trabalho (validação de `state`/CSRF, troca de código por token) que o GSI já resolve, sem benefício real aqui.

GSI foi escolhido porque devolve um `id_token` assinado diretamente no navegador (sem redirect gerenciado por nós), e o backend só precisa validar esse token e reaproveitar o mesmo fluxo de JWT/cookie que já existe — zero mudança em middleware, `api-client.ts` ou proxies existentes.

## Account linking

Se o email do Google já existir como conta email/senha, vincula automaticamente: associa o `googleId` à conta existente e loga normalmente. Não bloqueia nem exige confirmação extra.

## Schema (Prisma)

```prisma
model User {
  ...
  password  String?   // antes obrigatório, agora opcional (contas só-Google não têm senha)
  googleId  String?   @unique
  ...
}
```

Migration: `password` vira nullable, `googleId` novo campo nullable/unique. Usuários existentes não são afetados.

## Backend (Express)

Novo endpoint `POST /api/auth/google`, recebendo `{ credential }` (o `id_token` do Google).

`AuthService.authenticateWithGoogle(credential)`:
1. `OAuth2Client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID })` (lib `google-auth-library`)
2. Rejeita se `email_verified` for `false` no payload (evita spoofing)
3. Extrai `{ email, name, picture, sub: googleId }` do payload
4. Busca `User` por email:
   - existe e sem `googleId` → seta `googleId` (vincula) e segue
   - existe e já tem `googleId` → segue
   - não existe → cria novo `User` (`name`, `email`, `avatar: picture`, `googleId`, `password: null`)
5. Gera o mesmo JWT de sempre (`generateToken`, payload `{ id }`)
6. Retorna `{ user, token }` — mesmo formato de `login`/`register` atuais

`AuthController.googleLogin` segue o mesmo padrão dos outros métodos do controller (try/catch com `AppError`).

Nova dependência: `google-auth-library` (só em `apps/api`).
Nova env var: `GOOGLE_CLIENT_ID` (client ID do OAuth, público — não é secreto). Fail-fast no startup se ausente.

## Frontend (Next.js)

**Proxy** `apps/web/app/api/auth/google/route.ts` (POST): recebe `{ credential }`, repassa pro Express, seta o cookie `token` httpOnly na resposta — idêntico ao `apps/web/app/api/auth/login/route.ts` atual, só trocando o endpoint de destino e o body.

**Componente `GoogleSignInButton`** (client component, em `components/auth/GoogleSignInButton.tsx`, reusável em `/login` e `/register`):
- Carrega `https://accounts.google.com/gsi/client` via `next/script`
- Renderiza o botão oficial (`google.accounts.id.renderButton`)
- Callback recebe `credential` → `POST /api/auth/google` → sucesso: `router.push(redirect ?? "/")` + `router.refresh()` (mesmo padrão do logout existente); erro: toast (mesmo padrão do login atual)

Nova env var no front: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

Nas páginas `/login` e `/register`: separador "ou" + `<GoogleSignInButton />` abaixo do form existente.

## Erros e edge cases

- `credential` inválido/expirado → Express retorna 401 "Token do Google inválido"; proxy repassa status; botão mostra toast de erro
- `email_verified: false` no payload do Google → tratado como erro, login negado
- `GOOGLE_CLIENT_ID` ausente no ambiente (API) → erro no startup, fail-fast

## Setup fora do código

Necessário criar credenciais OAuth no Google Cloud Console (tipo "Web application"), com os origins JavaScript autorizados (`http://localhost:3000` em dev). O usuário fornece o `Client ID` gerado antes da fase de implementação/teste.

## Fora de escopo

- Definir senha posteriormente para contas criadas via Google
- Outros provedores sociais (Facebook, GitHub, etc.)
- Refresh de token do Google / revogação de acesso
