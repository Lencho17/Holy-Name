const express = require('express');
const crypto = require('crypto');
const ShareLink = require('../models/ShareLink');
const router = express.Router();

/**
 * POST /api/share
 * Creates a short share link. Body: { title, desc, image, page }
 * Returns: { id, url }
 */
router.post('/', async (req, res) => {
  try {
    const { title, desc, image, page } = req.body;
    const shortId = crypto.randomBytes(3).toString('hex'); // 6 chars

    await ShareLink.create({ shortId, title, desc, image, page });

    const clientUrl = (process.env.CLIENT_URL || 'https://holynamehsschool.in').replace(/\/$/, '');
    res.json({ id: shortId, url: `${clientUrl}/s/${shortId}` });
  } catch (error) {
    console.error('Share create error:', error.message);
    res.status(500).json({ message: 'Failed to create share link' });
  }
});

/**
 * GET /api/share/:id
 * Serves HTML with OG meta tags for rich link previews, then redirects.
 */
router.get('/:id', async (req, res) => {
  try {
    const link = await ShareLink.findOne({ shortId: req.params.id }).lean();
    if (!link) {
      const clientUrl = (process.env.CLIENT_URL || 'https://holynamehsschool.in').replace(/\/$/, '');
      return res.redirect(clientUrl);
    }

    const { title = 'Holy Name School', desc = '', image = '', page = '/' } = link;
    const clientUrl = (process.env.CLIENT_URL || 'https://holynamehsschool.in').replace(/\/$/, '');
    const redirectUrl = `${clientUrl}${page.startsWith('/') ? page : '/' + page}`;

    const safe = (str) => String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const safeTitle = safe(title);
    const safeDesc = safe(desc || `${title} — Holy Name School`);
    const safeImage = safe(image);
    const safeRedirect = safe(redirectUrl);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — Holy Name School</title>

  <!-- Open Graph -->
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

  <!-- Redirect -->
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
  } catch (error) {
    console.error('Share get error:', error.message);
    const clientUrl = (process.env.CLIENT_URL || 'https://holynamehsschool.in').replace(/\/$/, '');
    res.redirect(clientUrl);
  }
});

module.exports = router;
