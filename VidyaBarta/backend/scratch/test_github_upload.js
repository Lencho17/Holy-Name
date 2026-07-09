const fetch = require('node-fetch');
require('dotenv').config();

const uploadPdfToGithub = async (fileBuffer, fileName) => {
  try {
    let token = process.env.GITHUB_TOKEN;
    let repo = process.env.GITHUB_REPO;

    console.log('Using Repo:', repo);
    console.log('Token starts with:', token ? token.substring(0, 4) : 'null');

    if (repo.includes('github.com/')) {
      repo = repo.split('github.com/')[1].replace('.git', '');
    }

    const path = `notices/test-${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    const content = fileBuffer.toString('base64');

    console.log('Request URL:', url);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Holy-Name-CMS',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Upload test notice: ${fileName}`,
        content: content,
      }),
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', result);

    if (!response.ok) {
      throw new Error(`GitHub API error: ${result.message || response.statusText}`);
    }

    return `https://raw.githubusercontent.com/${repo}/main/${path}`;
  } catch (error) {
    console.error('Error uploading to GitHub:', error.message);
    throw error;
  }
};

const runTest = async () => {
  const dummyBuffer = Buffer.from('Hello World PDF Content');
  try {
    const url = await uploadPdfToGithub(dummyBuffer, 'test_from_script.pdf');
    console.log('Successfully uploaded! URL:', url);
  } catch (e) {
    console.error('Test failed:', e.message);
  }
};

runTest();
