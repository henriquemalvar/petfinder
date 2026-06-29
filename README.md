# PetFinder Monorepo

Plataforma unificada para encontrar pets perdidos, reportar achados e conectar adoções.

## Estrutura

```
apps/
  web/     Next.js 15 + shadcn/ui (porta 3000)
  api/     Express 5 + Prisma/PostgreSQL (porta 3333)
packages/
  tokens/  Design tokens blue light/dark (Stitch)
```

Projetos legados (`petfind/`, `petfinder/`) permanecem para referência até deprecação.

## Pré-requisitos

- Node.js 20+
- Docker (PostgreSQL local)

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Subir PostgreSQL (porta 5434 no host)
docker compose up -d

# 3. Configurar variáveis de ambiente
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# 4. Migrar e popular banco
npm run seed --workspace=@petfinder/api

# 5. Rodar em terminais separados
npm run dev:api
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:3333
- Swagger: http://localhost:3333/api-docs

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev:web` | Next.js com Turbopack |
| `npm run dev:api` | API com hot reload |
| `npm run seed` | Popular banco de dev |
| `npm run build` | Build de todos os workspaces |

## Fluxo principal

1. Registrar em `/register`
2. Publicar anúncio em `/post` (wizard 5 passos)
3. Ver listagem em `/find-pets` e mapa em `/map`
4. Detalhe em `/pets/[id]` com comentários da comunidade

## Tema

Blue light/dark baseado na referência Stitch (`pet_search_adoption_system` + `nocturnal_pet_discovery`). Toggle no navbar.
