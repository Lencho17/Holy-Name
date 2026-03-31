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
    let token = process.env.GITHUB_TOKEN;
    let repo = process.env.GITHUB_REPO; // Robustly handle both 'owner/repo' and 'https://github.com/owner/repo.git'

    // If variables appear missing, it is highly likely the Node server is in --watch mode 
    // and was started before the .env file existed or was populated. Auto-reload dot-env here:
    if (!token || !repo) {
      require('dotenv').config();
      token = process.env.GITHUB_TOKEN;
      repo = process.env.GITHUB_REPO;
    }

    if (!token || !repo) {
      throw new Error('GitHub configuration missing. Set GITHUB_TOKEN and GITHUB_REPO in .env');
    }

    // Clean up repo string if it's a full URL
    if (repo.includes('github.com/')) {
      repo = repo.split('github.com/')[1].replace('.git', '');
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
