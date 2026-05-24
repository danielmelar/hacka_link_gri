# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Inject the API URL at build time so Vite embeds it
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Gera o index.html da SPA a partir dos assets do build
# TanStack Start com Cloudflare target não emite index.html — criamos via shell
RUN ASSETS="dist/client/assets" && \
    CSS=$(ls "$ASSETS"/styles-*.css 2>/dev/null | head -1 | xargs -I{} basename {} 2>/dev/null) && \
    JS=$(ls "$ASSETS"/index-*.js "$ASSETS"/start-*.js 2>/dev/null | head -1 | xargs -I{} basename {} 2>/dev/null) && \
    echo "JS=$JS CSS=$CSS" && \
    { printf '<!DOCTYPE html>\n<html lang="pt-BR" class="dark">\n<head>\n'; \
      printf '  <meta charset="utf-8">\n'; \
      printf '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'; \
      printf '  <title>CLAVIS — Inteligência comercial imobiliária</title>\n'; \
      [ -n "$CSS" ] && printf '  <link rel="stylesheet" crossorigin href="/assets/%s">\n' "$CSS"; \
      printf '</head>\n<body>\n  <div id="root"></div>\n'; \
      [ -n "$JS" ]  && printf '  <script type="module" crossorigin src="/assets/%s"></script>\n' "$JS"; \
      printf '</body>\n</html>\n'; \
    } > dist/client/index.html && \
    echo "✅ index.html gerado" && cat dist/client/index.html

EXPOSE 4173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4173/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

# Serve dist/client como SPA — redireciona todas as rotas para index.html
CMD ["npx", "--yes", "serve", "dist/client", "--listen", "4173", "--single"]
