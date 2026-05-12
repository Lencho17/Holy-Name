const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  const signRes = await axios.get(`https://holy-name-sb9t.vercel.app/api/upload/sign?folder=admissions`);
  const { signature, timestamp, cloudName, apiKey } = signRes.data;

  const form = new FormData();
  form.append('file', fs.createReadStream('dummy.jpg'));
  form.append('signature', signature);
  form.append('timestamp', timestamp);
  form.append('folder', 'admissions');
  form.append('api_key', apiKey);

  try {
    const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, form, {
      headers: form.getHeaders()
    });
    console.log("SUCCESS:", res.data.secure_url);
  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
  }
}
test();
