const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/admin/payments/pending', (req, res) => {
  res.json({
    success: true,
    data: [
      { _id: 'pay_1', amount: 100, status: 'pending', metadata: { name: 'Test User', email: 'test@example.com' } }
    ]
  });
});

app.get('/api/admin/candidates', (req, res) => {
  res.json({ success: true, data: [{ _id: 'c1', name: 'Jane Doe', phone: '000' }] });
});

app.post('/api/submitPayment', (req, res) => {
  const { transactionCode, amount } = req.body;
  if (!transactionCode || !amount) {
    return res.status(400).json({ success: false, error: 'transactionCode and amount required' });
  }

  return res.json({
    success: true,
    message: 'Payment submitted (mock)',
    transactionId: transactionCode,
    paymentId: 'mock_' + Date.now(),
    paymentLink: null
  });
});

app.post('/api/submitpayments/payments', (req, res) => {
  // same behaviour for alternate endpoint
  const { transactionCode, amount } = req.body;
  if (!transactionCode || !amount) return res.status(400).json({ success: false, error: 'transactionCode and amount required' });
  res.json({ success: true, paymentId: 'mock_' + Date.now() });
});

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', env: 'mock' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Mock backend listening on http://localhost:${PORT}`));
