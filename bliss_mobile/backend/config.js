const API_BASE_URL = 'https://backened-server-1.onrender.com';

// Login request
fetch(`${API_BASE_URL}/api/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'boss', password: 'boss123' })
})
