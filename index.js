const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function hasFileExtension(pathname) {
  return /\.[A-Za-z0-9]+$/.test(pathname);
}

function assetPathFor(pathname) {
  return pathname === '/' || !hasFileExtension(pathname) ? '/index.html' : pathname;
}

function contentTypeFor(pathname) {
  const dot = pathname.lastIndexOf('.');
  return MIME_TYPES[dot >= 0 ? pathname.slice(dot).toLowerCase() : ''] || 'application/octet-stream';
}

function cloneRequest(url, request) {
  return new Request(url, {
    method: request.method,
    headers: request.headers,
  });
}

async function responseFromBytes(bytes, pathname) {
  return new Response(bytes, {
    headers: {
      'content-type': contentTypeFor(pathname),
    },
  });
}

async function respondFromAssets(request, env) {
  if (!env?.ASSETS?.fetch) return null;
  const url = new URL(request.url);
  const pathname = assetPathFor(url.pathname);
  const assetRequest = pathname === url.pathname ? request : cloneRequest(new URL(pathname, url), request);
  const response = await env.ASSETS.fetch(assetRequest);
  return response.ok ? response : null;
}

async function respondFromNode(request) {
  const [{ readFile, stat }, path] = await Promise.all([
    import('node:fs/promises'),
    import('node:path'),
  ]);
  const distDir = path.resolve(process.cwd(), 'dist');
  const url = new URL(request.url);
  const pathname = assetPathFor(url.pathname);
  const safePath = path.resolve(distDir, `.${pathname}`);
  if (!safePath.startsWith(distDir)) {
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  try {
    const info = await stat(safePath);
    if (info.isFile()) {
      return responseFromBytes(await readFile(safePath), pathname);
    }
  } catch {}

  if (pathname !== '/index.html') {
    return respondFromNode(cloneRequest(new URL('/index.html', url), request));
  }

  return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

async function handleRequest(request, env = {}) {
  const assetResponse = await respondFromAssets(request, env);
  if (assetResponse) return assetResponse;
  if (typeof process !== 'undefined' && process.versions?.node) {
    return respondFromNode(request);
  }
  return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

const worker = {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};

if (typeof addEventListener === 'function') {
  addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request, event));
  });
}

if (typeof process !== 'undefined' && process.versions?.node) {
  const { default: http } = await import('node:http');
  const port = Number(process.env.PORT || 3000);
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${port}`}`);
    const request = new Request(url, { method: req.method || 'GET', headers: req.headers });
    const response = await handleRequest(request, {});
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(Buffer.from(await response.arrayBuffer()));
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`photobooth listening on http://0.0.0.0:${port}`);
  });
}

export default worker;
