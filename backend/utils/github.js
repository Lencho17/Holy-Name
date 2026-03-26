/**
 * GitHub PDF Storage Utility
 *
 * Uploads PDF files to a GitHub repository and returns the raw URL.
 * This gives free, reliable, CDN-backed hosting for PDF documents.
 */

const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "username/repo-name"
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

/**
 * Upload a PDF buffer to GitHub and return the raw URL.
 * @param {Buffer} fileBuffer - The PDF file buffer
 * @param {string} originalName - The original filename
 * @returns {Promise<string>} The raw GitHub URL for the PDF
 */
async function uploadPdfToGithub(fileBuffer, originalName) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('GitHub configuration missing. Set GITHUB_TOKEN and GITHUB_REPO in .env');
  }

  // Sanitize filename and add timestamp to avoid collisions
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `notices/${Date.now()}-${safeName}`;

  const base64Content = fileBuffer.toString('base64');

  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Upload notice: ${originalName}`,
      content: base64Content,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GitHub upload failed: ${error.message}`);
  }

  const data = await response.json();

  // Return the raw URL that serves the file directly
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;
  return rawUrl;
}

module.exports = { uploadPdfToGithub };
