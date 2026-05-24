# Single stage — usa tsx para rodar TypeScript diretamente (igual ao dev)
# Mais simples, sem problemas de type-checking no build
FROM node:20-alpine

WORKDIR /app

# Install all dependencies (incluindo tsx)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code and config
COPY src ./src
COPY scripts ./scripts
COPY tsconfig.json ./
COPY .swcrc ./

# Create logs directory
RUN mkdir -p logs

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

# Start application using tsx (mesmo que o dev, sem precisar compilar)
CMD ["npx", "tsx", "src/server.ts"]
