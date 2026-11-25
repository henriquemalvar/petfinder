# PetFinder — PRD (retroativo)

**Data:** 2026-07-19
**Revisão:** 2026-08-28, na branch `feat/contato-instagram-preferencia`, que fechou as lacunas 1 a 4 da §9 original.
**Método:** auditoria de código do estado atual do monorepo (`apps/api` + `apps/web`), não teste manual da aplicação rodando. "Implementado" abaixo significa "existe no código", não "foi validado em uso".
**Objetivo do documento:** documentar o produto como ele é hoje e, principalmente, listar o que falta para fechar o fluxo. Cada seção tem uma coluna de lacuna para validar com o time.

---

## 1. Problema e proposta de valor

Plataforma para três jornadas de pets: **perdido** (LOST), **encontrado** (FOUND) e **adoção** (ADOPTION). Usuário publica um anúncio vinculado a um pet, outros usuários encontram por busca/mapa e comentam ou entram em contato pelo WhatsApp do dono.

## 2. Personas

- **Publicador**: perdeu um pet, encontrou um pet na rua, ou quer dar um pet para adoção.
- **Buscador/comunidade**: navega anúncios por tipo/localização, comenta, entra em contato.

## 3. Objetivos e métricas de sucesso

Não há analytics de produto instrumentado hoje (nenhum evento rastreado); as métricas abaixo são o alvo a instrumentar, não números já coletados.

- **Taxa de resolução**: % de posts LOST/FOUND que chegam a status `RESOLVED` em até 30 dias da publicação. O dono já consegue marcar o desfecho pela UI (§6.2); falta instrumentar a medição.
- **Tempo até resolução**: mediana de dias entre criação do post e mudança para `RESOLVED`. Mesma dependência de instrumentação.
- **Ativação**: % de usuários registrados que publicam ao menos um anúncio.
- **Engajamento no anúncio**: comentários por post; cliques no contato, hoje já renderizado em WhatsApp e Instagram conforme `contactPreference` (§6.3).
- **Alcance geolocalizado**: usuários notificados por post via busca por raio (`notifyNearbyUsers`), hoje entregues como notificação in-app (§6.5).

## 4. Stack

- `apps/api`: Express 5 + Prisma/PostgreSQL, JWT, Cloudinary (upload), Swagger.
- `apps/web`: Next.js 15 (App Router) + shadcn/ui, Tailwind 4.
- Monorepo npm workspaces; `packages/tokens` só design tokens.
- Legado: a pasta `petfind/` na raiz não é referenciada pelo app atual e está no `.gitignore`, pendente de remoção do disco (ver §8).

## 5. Modelo de dados (Prisma)

`User`, `Pet`, `Post` (type: LOST/FOUND/ADOPTION, status: ACTIVE/RESOLVED/CANCELED), `Comment`, `Notification`, `NotificationToken`. Um `Post` sempre referencia um `Pet`: a criação combinada é feita por um endpoint único chamado "Announcement" (`AnnouncementService`), que cria Pet + Post (mais atualização opcional do contato do usuário) numa transação. Não é um segundo conceito de produto, é o wizard de publicação.

## 6. Funcionalidades: implementado vs. lacuna

### 6.1 Autenticação
| Implementado | Lacuna |
|---|---|
| Registro e login com email/senha (JWT, bcrypt) | Sem "esqueci minha senha" / reset de senha (única lacuna de auth aberta) |
| Login social Google (`/api/auth/google`) | Nenhuma pendência identificada |
| Rate limit no `/api/auth/*` | Nenhuma pendência identificada |
| Middleware Next.js protege `/post` e `/profile` por cookie | Nenhuma pendência identificada |
| Troca de senha para quem já está logado e exclusão de conta com confirmação de senha, na seção Segurança do perfil | Nenhuma pendência identificada |

### 6.2 Publicação de anúncio (`/post`, wizard 5 passos)
| Implementado | Lacuna |
|---|---|
| Criação combinada Pet+Post (LOST/FOUND/ADOPTION) em transação | Nenhuma pendência identificada |
| Título/descrição padrão gerados por tipo | Nenhuma pendência identificada |
| Upload de imagem (Cloudinary via `/api/uploads`) | Nenhuma pendência identificada |
| Geolocalização do pet (lat/lng) | Nenhuma pendência identificada |
| Edição do anúncio pelo dono (`EditAnnouncementDialog`, consome `PATCH /api/pets/:id` e `/api/posts/:id`) | Nenhuma pendência identificada |
| Exclusão do anúncio pelo dono | Nenhuma pendência identificada |
| Marcar como resolvido ou cancelado pela UI, sem re-notificar a vizinhança na mudança de status | Nenhuma pendência identificada |

### 6.3 Descoberta (`/find-pets`, `/map`, `/pets/[id]`)
| Implementado | Lacuna |
|---|---|
| Listagem paginada com filtro por tipo e busca textual (`GET /api/posts` com page/limit/type/search) | Nenhuma pendência identificada |
| Mapa interativo (MapLibre) com pins por post, hero tour animado | Nenhuma pendência identificada |
| Página de detalhe com dados do pet, dono e comentários | Nenhuma pendência identificada |
| Contato via WhatsApp e Instagram (`ContactActions`), com o canal preferido em primeiro | Nenhuma pendência identificada |
| `contactPreference` (WHATSAPP/INSTAGRAM) respeitado na ordem dos botões de contato | Nenhuma pendência identificada |
| Paginação em `GET /api/posts` e nos endpoints de Pet (`findAll`, `findByUserId`, `findByPetId`, retornando `Paginated<PetResponse>`) | Nenhuma pendência identificada |

### 6.4 Comentários
| Implementado | Lacuna |
|---|---|
| Criar e listar comentários por post, autenticado para criar | Sem edição/exclusão de comentário (nem pelo autor, nem moderação) |

### 6.5 Notificações
| Implementado | Lacuna |
|---|---|
| Notificação in-app: sino no navbar, popover, contagem de não lidas, marcar como lida (`GET /api/notifications`, `PATCH /:id/read`), polling 30s | Nenhuma pendência identificada |
| Alerta geolocalizado: ao criar post, busca usuários num raio de 10km (bounding box + Haversine, extraído em `utils/geo` e coberto por teste) e grava `Notification` in-app para cada vizinho | Sem entrega fora do app (nem push, nem email). O usuário só vê o alerta ao abrir o site |
| Push nativo via Expo e o model `NotificationToken` foram removidos, junto com as rotas órfãs | Nenhuma pendência identificada |
| `RESEND_API_KEY` removida do `.env.example` | Notificação por email segue não implementada, agora como escolha explícita e não como variável reservada sem uso |

### 6.6 Perfil (`/profile`)
| Implementado | Lacuna |
|---|---|
| Editar nome, WhatsApp, Instagram, avatar (upload) | Email é somente leitura (esperado) |
| Grid dos próprios anúncios (`GET /api/posts?userId=&limit=12`) com editar, excluir e marcar desfecho | Nenhuma pendência identificada |
| Busca dos anúncios do usuário | Sem paginação/"ver mais" no perfil (limit=12 fixo, sem próxima página) |
| Seção Segurança: troca de senha e exclusão de conta | Nenhuma pendência identificada |

## 7. Não-funcionais

- **Segurança**: hardening de 13 PRs já mergeado. IDOR corrigido, JWT_SECRET obrigatório, rate-limit + helmet, upload sem lib vulnerável, ESLint flat config, CI (GitHub Actions). Audit: 0 crítica/0 alta (restam moderadas transitivas de postcss/qs, resolvem só com Next 16).
- **Testes**: 44 testes vitest na API, em 7 arquivos (serviços, schemas de update, `geo`, `pagination`). Cypress e2e: `auth.cy.ts` (9) e `authz.cy.ts` (5, cobre IDOR) vivem na branch `test/e2e-auth-flows`; a branch de features tem só `smoke.cy.ts` (6). **As telas novas de edição, exclusão, desfecho e segurança do perfil não têm cobertura e2e.**
- **CI**: lint + `tsc` + testes na API; lint + `tsc` + `next build` no web.

## 8. Fora de escopo / débito técnico conhecido

- Remover a pasta legada `petfind/` na raiz (não referenciada pelo app atual, não versionada).
- Migração para Next 16 (destrava as vulnerabilidades moderadas restantes).
- Sem deploy configurado: não há host definido para a API nem para o web, e nada executa `prisma migrate deploy` num release.
- Sem "esqueci minha senha", sem edição/moderação de comentário, sem analytics de produto.

## 9. Ordem sugerida para fechar as lacunas (prioridade por impacto)

As cinco lacunas da versão original deste documento estão fechadas. O que resta para uma v0 no ar:

1. **Escolher onde a API roda, ligar as migrations no release e definir `NEXT_PUBLIC_API_URL` em tempo de build.** É o único bloqueio duro. Sem `prisma migrate deploy` o primeiro deploy sobe contra um banco vazio; o script `migrate:deploy` já existe em `apps/api`. E `NEXT_PUBLIC_API_URL` é substituída no bundle durante o `next build`: se o host só a expuser em runtime, o build embute o fallback `http://localhost:3333` sem falhar, e a busca de `/find-pets` (único fetch client-side que fala direto com a API) quebra no navegador do visitante. Alternativa que elimina o risco: criar `app/api/posts/route.ts` como proxy de listagem e apontar `FindPetsContent` para `/api/posts`, o que também dispensa a API ser alcançável por CORS do navegador.
2. **Cobertura e2e das telas novas** (§7). Editar, excluir, marcar desfecho, trocar senha e excluir conta são hoje os fluxos mais destrutivos do produto e os menos testados.
3. **Preencher o e-mail de contato da política de privacidade** (`/privacidade`), hoje um placeholder.
4. **"Esqueci minha senha"** (§6.1). Depende de decidir o canal de email, que foi adiado junto com o Resend.
5. **Paginação no grid do perfil** (§6.6) e instrumentação das métricas da §3. Ambos escalam mal em silêncio, nenhum bloqueia a v0.
