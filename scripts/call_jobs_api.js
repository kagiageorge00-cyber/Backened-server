const axios = require('axios');
require('dotenv').config();

const BASE = process.env.BACKEND_URL || 'http://localhost:3000';
const TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 30000;

async function fetchJobs() {
  try {
    const target = `${BASE}/api/jobs`;
    console.log('Requesting', target);
    const res = await axios.get(target, {
      params: { page: 1, limit: 20 },
      timeout: TIMEOUT,
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('HTTP error:', err.response.status, err.response.data);
    } else {
      console.error('Request error:', err.message);
    }
    process.exitCode = 1;
  }
}

fetchJobs();
