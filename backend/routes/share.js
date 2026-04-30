const express = require('express');
const router = express.Router();

/**
 * GET /api/share
 * Serves an HTML page with Open Graph meta tags for rich link previews
 * on WhatsApp, Facebook, Twitter, etc.
 * 
 * Query params:
 *   title    – Content title (e.g. "Annual Sports Day")
 *   desc     – Description text
 *   image    – Cover image URL
 *   page     – Frontend page to redirect to (e.g. "/gallery", "/")
 */
router.get('/', (req, res) => {
  const {
    title = 'Holy Name School',
    desc = 'Holy Name Senior Secondary School — Let Your Light Shine',
    image = '',
    page = '/'
  } = req.query;

  // Build the frontend redirect URL
  const clientUrl = (process.env.CLIENT_URL || 'https://holynamehsschool.in').replace(/\/$/, '');
  const redirectUrl = `${clientUrl}${page.startsWith('/') ? page : '/' + page}`;

  // Sanitize values to prevent XSS in the HTML output
  const safe = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const safeTitle = safe(title);
  const safeDesc = safe(desc);
  const safeImage = safe(image);
  const safeRedirect = safe(redirectUrl);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — Holy Name School</title>

  <!-- Open Graph (Facebook, WhatsApp, etc.) -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${safeRedirect}" />
  <meta property="og:site_name" content="Holy Name School" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />

  <!-- Auto-redirect for real users (not crawlers) -->
  <meta http-equiv="refresh" content="0; url=${safeRedirect}" />
  <script>window.location.replace("${redirectUrl.replace(/"/g, '\\"')}");</script>
</head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;">
  <div style="text-align:center;padding:2rem;">
    <h1>${safeTitle}</h1>
    <p>${safeDesc}</p>
    <p>Redirecting to <a href="${safeRedirect}">Holy Name School</a>…</p>
  </div>
</body>
</html>`);
});

module.exports = router;
