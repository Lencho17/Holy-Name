const axios = require('axios');

async function testRead() {
  const inquiryId = 'ae543331-c297-4cba-9746-e88a78e35673';
  const url = `http://localhost:5000/api/inquiries/${inquiryId}/read`;
  try {
    const res = await axios.patch(url, {});
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error:', err.response ? err.response.status : err.message);
    if (err.response) console.log('Data:', err.response.data);
  }
}

testRead();
