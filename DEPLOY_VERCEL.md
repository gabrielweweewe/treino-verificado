# Deploy no Vercel — Passo a passo rápido

## 1. Conta e CLI
- Acesse [vercel.com](https://vercel.com) e faça login (GitHub/GitLab/Email).
- Instale o Vercel CLI (opcional): `npm i -g vercel`

## 2. Subir o código no Git
- Crie um repositório no GitHub (ex.: `treino-verificado`).
- No projeto:
  ```bash
  git init
  git add .
  git commit -m "Deploy Vercel"
  git branch -M main
  git remote add origin https://github.com/SEU_USUARIO/treino-verificado.git
  git push -u origin main
  ```

## 3. Deploy pelo site (recomendado)
1. Em [vercel.com/new](https://vercel.com/new), clique em **Import** no repositório do projeto.
2. **Framework Preset**: Next.js (já detectado).
3. **Root Directory**: deixe em branco.
4. **Build Command**: `next build` (padrão).
5. **Output Directory**: deixe padrão (`.next`).
6. Em **Environment Variables** adicione:
   - `TRELLO_API_KEY` = sua API key do Trello
   - `TRELLO_TOKEN` = seu token do Trello
7. Clique em **Deploy**.

## 4. Deploy pela CLI (alternativa)
Na pasta do projeto:
```bash
vercel
```
- Login na primeira vez.
- Responda: **Set up and deploy?** → Y  
- **Which scope?** → sua conta  
- **Link to existing project?** → N  
- **Project name?** → enter (ou um nome)  
- **Directory?** → enter  

Depois, no dashboard da Vercel: **Project → Settings → Environment Variables** e adicione `TRELLO_API_KEY` e `TRELLO_TOKEN`. Em seguida: **Deployments → ⋮ no último deploy → Redeploy**.

## 5. Pronto
- A URL será algo como: `treino-verificado-xxx.vercel.app`
- Cada `git push` na branch conectada gera um novo deploy automático.
