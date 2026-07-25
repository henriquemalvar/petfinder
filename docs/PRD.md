# PetFinder — PRD (retroativo)

**Data:** 2026-07-19
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

- **Taxa de resolução**: % de posts LOST/FOUND que chegam a status `RESOLVED` em até 30 dias da publicação. Hoje impossível de medir de fato — não existe UI para marcar um post como resolvido (gap §6.2).
- **Tempo até resolução**: mediana de dias entre criação do post e mudança para `RESOLVED`. Mesma dependência do gap acima.
- **Ativação**: % de usuários registrados que publicam ao menos um anúncio.
- **Engajamento no anúncio**: comentários por post; cliques no contato (WhatsApp/Instagram) — hoje só WhatsApp é renderizado (gap §6.3).
- **Alcance geolocalizado**: usuários notificados por post via busca por raio (`notifyNearbyUsers`). Hoje sempre zero na prática, porque nenhum token de push é registrado pelo web (gap §6.5).

## 4. Stack

- `apps/api`: Express 5 + Prisma/PostgreSQL, JWT, Cloudinary (upload), Swagger.
- `apps/web`: Next.js 15 (App Router) + shadcn/ui, Tailwind 4.
- Monorepo npm workspaces; `packages/tokens` só design tokens.
- Legado (`petfind/`, raiz `petfinder/` antigo): não referenciado pelo app atual, pendente de remoção (ver §8).

## 5. Modelo de dados (Prisma)

`User`, `Pet`, `Post` (type: LOST/FOUND/ADOPTION, status: ACTIVE/RESOLVED/CANCELED), `Comment`, `Notification`, `NotificationToken`. Um `Post` sempre referencia um `Pet`: a criação combinada é feita por um endpoint único chamado "Announcement" (`AnnouncementService`), que cria Pet + Post (mais atualização opcional do contato do usuário) numa transação. Não é um segundo conceito de produto, é o wizard de publicação.

## 6. Funcionalidades: implementado vs. lacuna

### 6.1 Autenticação
| Implementado | Lacuna |
|---|---|
| Registro e login com email/senha (JWT, bcrypt) | Sem "esqueci minha senha" / reset de senha |
| Login social Google (`/api/auth/google`) | Sem troca de senha para quem já está logado |
| Rate limit no `/api/auth/*` | Sem exclusão de conta (self-service) |
| Middleware Next.js protege `/post` e `/profile` por cookie | Nenhuma pendência identificada |

### 6.2 Publicação de anúncio (`/post`, wizard 5 passos)
| Implementado | Lacuna |
|---|---|
| Criação combinada Pet+Post (LOST/FOUND/ADOPTION) em transação | Nenhuma pendência identificada |
| Título/descrição padrão gerados por tipo | Nenhuma pendência identificada |
| Upload de imagem (Cloudinary via `/api/uploads`) | Nenhuma pendência identificada |
| Geolocalização do pet (lat/lng) | Nenhuma pendência identificada |
| **Nenhuma tela de edição de anúncio existente.** A API tem `PUT`/`PATCH /api/pets/:id` e `/api/posts/:id` completos, mas não há botão nem rota no web para editá-los | **Gap real: dono não consegue corrigir um anúncio publicado** |
| **Nenhuma tela de exclusão.** A API tem `DELETE` em pets e posts | **Gap: dono não consegue apagar um anúncio duplicado/errado** |
| **Nenhuma forma de mudar `status` do post.** O enum `ACTIVE/RESOLVED/CANCELED` existe no schema e na API (`PATCH /api/posts/:id`), mas não há UI para marcar "resolvido" (pet encontrado/adotado) ou "cancelado" | **Gap prioritário para um produto de pet perdido: hoje um anúncio fica "ativo" para sempre, mesmo depois do desfecho** |

### 6.3 Descoberta (`/find-pets`, `/map`, `/pets/[id]`)
| Implementado | Lacuna |
|---|---|
| Listagem paginada com filtro por tipo e busca textual (`GET /api/posts` com page/limit/type/search) | Nenhuma pendência identificada |
| Mapa interativo (MapLibre) com pins por post, hero tour animado | Nenhuma pendência identificada |
| Página de detalhe com dados do pet, dono e comentários | Nenhuma pendência identificada |
| Contato via WhatsApp (link `wa.me` gerado a partir de `user.whatsapp`) | Campo `instagram` do dono é armazenado e editável no perfil, mas **não aparece como link/contato na página de detalhe**; só WhatsApp é renderizado |
| `contactPreference` (WHATSAPP/INSTAGRAM) salvo no banco | **Não é usado para decidir qual contato mostrar.** A preferência do usuário é ignorada na UI |
| Paginação em `GET /api/posts` (listagem geral) | `findByUserId`/`findByPetId`/`findAll` de Pet **sem paginação** (carregam tudo). Baixo risco hoje, mas escala mal |

### 6.4 Comentários
| Implementado | Lacuna |
|---|---|
| Criar e listar comentários por post, autenticado para criar | Sem edição/exclusão de comentário (nem pelo autor, nem moderação) |

### 6.5 Notificações
| Implementado | Lacuna |
|---|---|
| Notificação in-app: sino no navbar, popover, contagem de não lidas, marcar como lida (`GET /api/notifications`, `PATCH /:id/read`), polling 30s | Nenhuma pendência identificada |
| Serviço de push geolocalizado: ao criar post, busca usuários num raio de 10km (bounding box + Haversine) e dispara push via Expo (`notifyNearbyUsers`) | **Infraestrutura órfã.** O token registrado é formato Expo (push nativo React Native); não existe app mobile no monorepo, e o web não tem nenhuma tela ou chamada que registre um token (`POST /api/notifications/register` e `/nearby` não têm proxy nem client no `apps/web`). O código roda, mas não tem quem alimente `NotificationToken`, então `notifyNearbyUsers` sempre encontra zero tokens na prática |
| `RESEND_API_KEY` no `.env.example` | Não há `EmailService`/uso de Resend no código; variável reservada mas não implementada, sem notificação por email |

### 6.6 Perfil (`/profile`)
| Implementado | Lacuna |
|---|---|
| Editar nome, WhatsApp, Instagram, avatar (upload) | Email é somente leitura (esperado) |
| Grid dos próprios anúncios (`GET /api/posts?userId=&limit=12`) | Grid é **somente leitura**; reforça o gap de 6.2 (sem editar/excluir/resolver a partir do perfil, que seria o lugar natural) |
| Busca dos anúncios do usuário | Sem paginação/"ver mais" no perfil (limit=12 fixo, sem próxima página) |

## 7. Não-funcionais

- **Segurança**: hardening de 13 PRs já mergeado. IDOR corrigido, JWT_SECRET obrigatório, rate-limit + helmet, upload sem lib vulnerável, ESLint flat config, CI (GitHub Actions). Audit: 0 crítica/0 alta (restam moderadas transitivas de postcss/qs, resolvem só com Next 16).
- **Testes**: 7 testes vitest (API, unitários de serviço) mais Cypress e2e: `auth.cy.ts` (9), `authz.cy.ts` (5, cobre IDOR), `smoke.cy.ts` (6). Sem testes de UI para os fluxos de edição/exclusão porque essas telas não existem (§6.2).
- **CI**: `tsc` api+web, lint, `next build` (19/19 páginas), verde em main.

## 8. Fora de escopo / débito técnico conhecido

- Remover pastas legadas `petfind/` e `petfinder/` (não usadas pelo app atual, README já avisa que são referência até deprecação).
- Migração para Next 16 (destrava as vulnerabilidades moderadas restantes).
- Troca de senha, exclusão de conta (explicitamente fora de escopo desde a spec de 2026-06-29).

## 9. Ordem sugerida para fechar as lacunas (prioridade por impacto)

1. **Editar / excluir / marcar como resolvido um anúncio** (§6.2). A API já suporta tudo, é só UI. Maior gap do produto: sem isso, o caso de uso central (pet foi encontrado, tira o anúncio do ar) não se completa.
2. **Renderizar contato por Instagram e respeitar `contactPreference`** (§6.3). Dado já existe, só falta 1 componente.
3. **Decidir o destino do push geolocalizado** (§6.5): construir app mobile Expo para consumir, trocar por Web Push (VAPID), ou remover o código morto. Hoje é ambiguidade, não funcionalidade.
4. **Paginação em `findByUserId`/`findByPetId`/`findAll` de Pet.** Baixo risco agora, mas fica mais caro depois.
5. Decidir sobre `RESEND_API_KEY`: implementar `EmailService` ou remover a variável não usada.
