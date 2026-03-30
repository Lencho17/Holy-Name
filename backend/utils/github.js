const fetch = require('node-fetch');

/**
 * Uploads a file buffer to GitHub repository.
 * Uses GITHUB_TOKEN and GITHUB_REPO from environment variables.
 * @param {Buffer} fileBuffer - The file content to upload.
 * @param {string} fileName - The name of the file.
 * @returns {Promise<string>} The raw URL of the uploaded file on GitHub.
 */
const uploadPdfToGithub = async (fileBuffer, fileName) => {
  try {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO; // In 'owner/repo' format

    if (!token || !repo) {
      throw new Error('GitHub configuration missing. Set GITHUB_TOKEN and GITHUB_REPO in .env');
    }

    const path = `notices/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    const content = fileBuffer.toString('base64');

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload notice: ${fileName}`,
        content: content,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`GitHub API error: ${result.message || response.statusText}`);
    }

    // Return the raw user content URL
    return `https://raw.githubusercontent.com/${repo}/main/${path}`;
  } catch (error) {
    console.error('Error uploading to GitHub:', error.message);
    throw error;
  }
};

module.exports = { uploadPdfToGithub };
