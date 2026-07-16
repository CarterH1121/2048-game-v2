const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const host = '127.0.0.1';
const port = Number(process.env.PLAYER_PORT || 8082);
const apiPort = Number(process.env.LOCAL_V2_API_PORT || 3001);
const root = path.resolve(__dirname, '..');
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const inlineScriptHashes = [...indexSource.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1].replace(/\r\n?/g, '\n'))
  .map((script) => `'sha256-${crypto.createHash('sha256').update(script, 'utf8').digest('base64')}'`);
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' ${inlineScriptHashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8'
};

function staticSecurityHeaders() {
  return {
    'Content-Security-Policy': contentSecurityPolicy,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
}

function proxyApi(req, res) {
  const upstream = http.request({
    hostname: host,
    port: apiPort,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${host}:${apiPort}` }
  }, (upstreamResponse) => {
    res.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(res);
  });
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: '本地 V2 后端不可用' }));
  });
  req.pipe(upstream);
}

function serveFile(req, res) {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);
  } catch {
    res.writeHead(400, staticSecurityHeaders());
    return res.end('请求地址无效');
  }
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const relative = path.normalize(decodeURIComponent(requested)).replace(/^([/\\])+/, '');
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    res.writeHead(403, staticSecurityHeaders());
    return res.end('无权访问');
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (path.extname(filePath)) {
        res.writeHead(404, staticSecurityHeaders());
        return res.end('资源不存在');
      }
      return fs.readFile(path.join(root, 'index.html'), (indexError, indexData) => {
        if (indexError) {
          res.writeHead(500, staticSecurityHeaders());
          return res.end('玩家端入口暂不可用');
        }
        res.writeHead(200, { ...staticSecurityHeaders(), 'Content-Type': contentTypes['.html'], 'Cache-Control': 'no-store' });
        res.end(indexData);
      });
    }
    const extension = path.extname(filePath).toLowerCase();
    const headers = { ...staticSecurityHeaders(), 'Content-Type': contentTypes[extension] || 'application/octet-stream' };
    if (extension === '.html' || path.basename(filePath) === 'sw.js') headers['Cache-Control'] = 'no-store';
    res.writeHead(200, headers);
    res.end(data);
  });
}

http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { ...staticSecurityHeaders(), 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ status: 'ok', environment: 'local-v2-player' }));
  }
  if (req.url.startsWith('/api/')) return proxyApi(req, res);
  return serveFile(req, res);
}).listen(port, host, () => {
  console.log(`2048 V2 player available at http://${host}:${port}`);
});
