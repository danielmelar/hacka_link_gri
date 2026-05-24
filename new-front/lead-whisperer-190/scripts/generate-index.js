#!/usr/bin/env node
/**
 * Gera o index.html da SPA a partir dos assets buildados pelo Vite/TanStack Start.
 * TanStack Start com Cloudflare target não emite index.html — este script o cria.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
const fs = { readFileSync, writeFileSync, readdirSync, statSync, existsSync };
const path = { join };

const assetsDir = path.join('dist', 'client', 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error('ERRO: dist/client/assets não encontrado');
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);

// CSS principal
const cssFile = files.find(f => f.startsWith('styles') && f.endsWith('.css'));

// JS entry point (index-*.js ou start-*.js que não sejam chunks menores)
const jsEntry = files
  .filter(f => (f.startsWith('index-') || f.startsWith('start-')) && f.endsWith('.js'))
  .sort((a, b) => {
    // Prefere o maior arquivo (entry point real)
    const sizeA = fs.statSync(path.join(assetsDir, a)).size;
    const sizeB = fs.statSync(path.join(assetsDir, b)).size;
    return sizeB - sizeA;
  })[0];

if (!jsEntry) {
  console.error('ERRO: Não encontrou o JS entry point em', assetsDir);
  console.log('Arquivos disponíveis:', files.join(', '));
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CLAVIS — Inteligência comercial imobiliária</title>
  <meta name="description" content="CRM inteligente para corretores imobiliários">
  ${cssFile ? `<link rel="stylesheet" crossorigin href="/assets/${cssFile}">` : ''}
</head>
<body>
  <div id="root"></div>
  <script type="module" crossorigin src="/assets/${jsEntry}"></script>
</body>
</html>`;

const outPath = path.join('dist', 'client', 'index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`✅ index.html gerado:`);
console.log(`   JS:  /assets/${jsEntry}`);
console.log(`   CSS: ${cssFile ? '/assets/' + cssFile : '(nenhum)'}`);
