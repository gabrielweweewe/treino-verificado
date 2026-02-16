# Progressao de Carga (Next.js + Trello)

Aplicativo minimalista para registrar progressao de carga em musculacao com persistencia real na API do Trello.

## Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- Framer Motion
- Recharts
- API REST do Trello (sem mock)
- PWA (instalavel)

## Funcionalidades

- Bootstrap automatico do board `🏋️ Progressão de Carga`
- Garantia das listas:
  - `📌 Exercícios`
  - `🗓 Treinos`
  - `🏆 PRs`
- Registro de treino em fluxo rapido (selecionar exercicio -> salvar carga/reps)
- Atualizacao da descricao do card de exercicio em markdown estruturado:
  - Ultimo treino
  - Melhor marca (PR)
  - Historico resumido dos ultimos 5 treinos
- Detecao de PR:
  - maior carga, ou
  - mesma carga com mais reps
- Gamificacao elegante:
  - barra de progresso vs PR
  - badge animada para PR
  - confete discreto
  - feedback de delta de carga
  - vibracao leve em mobile
- Dashboard simples:
  - treinos da semana
  - ultimo PR
  - exercicio mais evoluido
  - grafico de evolucao de carga

## Variaveis de ambiente

Crie um arquivo `.env` na raiz:

```bash
TRELLO_API_KEY=sua_chave
TRELLO_TOKEN=seu_token
```

As credenciais nunca sao expostas no frontend. O cliente conversa apenas com rotas internas em `app/api`.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Rotas API internas

- `GET /api/bootstrap` - garante board/listas
- `GET /api/exercises` - lista exercicios
- `POST /api/exercises` - cria exercicio
- `POST /api/workout` - registra treino e valida PR
- `GET /api/dashboard` - retorna metricas do dashboard

## Estrutura principal

- `services/trello.ts` - camada de servico Trello server-side
- `app/api/*` - proxy seguro para operacoes Trello
- `components/workout-app.tsx` - tela principal mobile-first
- `components/evolution-chart.tsx` - grafico Recharts
- `components/confetti-burst.tsx` - feedback visual discreto

## Deploy na Vercel

1. Suba o projeto na Vercel.
2. Configure `TRELLO_API_KEY` e `TRELLO_TOKEN` no painel de Environment Variables.
3. Execute deploy.

O app ja esta preparado para PWA e instalacao em mobile.
