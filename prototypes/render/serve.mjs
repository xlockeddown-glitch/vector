import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = fs.realpathSync(new URL('.', import.meta.url));
const port = Number(process.env.PORT ?? 5178);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

function inside(file) {
  const relative = path.relative(root, file);
  return relative === '' ||
    (!path.isAbsolute(relative) && relative !== '..' &&
      !relative.startsWith(`..${path.sep}`));
}

http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let file;
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    let pathname = decodeURIComponent(url.pathname).replaceAll('\\', '/');
    if (pathname.includes('\0')) throw new Error('Invalid path');
    if (pathname === '/') pathname = '/index.html';
    file = path.resolve(root, `.${pathname}`);
    if (!inside(file)) throw new Error('Outside root');
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  try {
    file = await fs.promises.realpath(file);
    if (!inside(file)) {
      res.writeHead(404).end('Not found');
      return;
    }
    const stat = await fs.promises.stat(file);
    if (!stat.isFile()) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store'
    });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`VECTOR render prototype: http://127.0.0.1:${port}/`);
});
