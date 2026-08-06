export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url parameter');

  // Validate scheme — block javascript:/data: injection (XSS via img src / inline JS).
  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).send('Invalid url'); }
  if (parsed.protocol !== 'https:') return res.status(400).send('Only https urls are allowed');
  const allowedHost = process.env.BLOB_PUBLIC_HOST;
  const isVercelBlob = parsed.hostname === 'vercel-blob.com' || parsed.hostname.endsWith('.vercel-storage.com');
  if (allowedHost ? parsed.hostname !== allowedHost : !isVercelBlob) {
    return res.status(400).send('Host not allowed');
  }

  // Filename from the validated URL's pathname (excludes query/fragment, so `//` or
  // `/` inside the query string cannot poison the extraction). Sanitise for safety.
  const filename = (parsed.pathname.split('/').pop() || 'poster.jpg').replace(/[^\w.\-]/g, '_') || 'poster.jpg';

  // Escape untrusted url/filename for HTML attribute context.
  const esc = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const imgSrc = esc(url);
  const fname = esc(filename);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Photobooth Poster</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #0B1912;
      color: #F0F5F2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      max-width: 600px;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #FFCB2F;
      text-align: center;
    }
    .btn-group {
      display: flex;
      gap: 12px;
      width: 100%;
      flex-wrap: wrap;
      justify-content: center;
    }
    .btn {
      flex: 1;
      min-width: 120px;
      padding: 14px 24px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-download {
      background: #006b3f;
      color: white;
      flex: 2;
    }
    .btn-download:hover {
      background: #00874f;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 107, 63, 0.4);
    }
    .btn-back {
      background: rgba(255, 255, 255, 0.1);
      color: #F0F5F2;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .btn-back:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    @media (max-width: 480px) {
      h1 { font-size: 20px; }
      .btn { min-width: 100px; padding: 12px 16px; font-size: 14px; }
      .btn-group { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📸 Photobooth Poster</h1>
    <img src="${imgSrc}" alt="Poster" />
    <div class="btn-group">
      <a href="/api/download?url=${encodeURIComponent(url)}" download class="btn btn-download">⬇️ Tải ảnh</a>
      <button id="back-btn" class="btn btn-back">← Quay lại</button>
    </div>
  </div>

  <script>
    document.getElementById('back-btn').addEventListener('click', () => window.history.back());
  </script>
</body>
</html>
  `);
}
