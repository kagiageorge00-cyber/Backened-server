const express = require('express');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

const server = app.listen(4000, async () => {
  console.log('Test admin server running on http://localhost:4000');

  try {
    const res = await fetch('http://localhost:4000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'boss', password: 'boss123' })
    });

    const text = await res.text();
    console.log('📡 Status:', res.status);
    console.log('📦 Body:', text);
  } catch (err) {
    console.error('❌ Test request failed:', err);
  } finally {
    server.close();
  }
});
