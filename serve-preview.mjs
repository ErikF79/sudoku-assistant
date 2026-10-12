// Minimal static preview server for the exported `out/` folder.
// No external dependencies. Usage: node serve-preview.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('./out', import.meta.url));
const port = Number(process.argv[2] || process.env.PORT || 4173);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const safePath = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const candidates = [];
  if (safePath === '/' || safePath === '\\' || safePath === '') {
    candidates.push(join(rootDir, 'index.html'));
  } else {
    const base = join(rootDir, safePath.split('/').join(sep));
    candidates.push(base, `${base}.html`, join(base, 'index.html'));
  }
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      /* try next */
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  try {
    const file = await resolveFile(req.url || '/');
    if (!file) {
      const notFound = join(rootDir, '404.html');
      try {
        const body = await readFile(notFound);
        res.writeHead(404, { 'Content-Type': mime['.html'] });
        res.end(body);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 - Not found');
      }
      return;
    }
    const body = await readFile(file);
    const type = mime[extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`500 - ${error.message}`);
  }
});

server.listen(port, () => {
  console.log(`\n  Aiuto Sudoku disponibile su:  http://localhost:${port}\n`);
  console.log('  Premi CTRL+C per fermare il server.\n');
});
