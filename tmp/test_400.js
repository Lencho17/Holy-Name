const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/admissions');
    console.log('Success:', res.status);
  } catch (err) {
    console.log('Error:', err.response?.status, err.response?.data);
  }
}

test();
