# IntaSend Payments API

## Base URL
- Development: http://localhost:3000/api/payments
- Production: https://backened-server-1.onrender.com/api/payments

## Endpoints

### POST /api/payments/create
Creates a payment checkout session for an application fee.

Request body:
{
  "candidateId": "candidate-object-id",
  "amount": 1300,
  "paymentMethod": "mpesa",
  "title": "Bliss Connect Application Fee",
  "email": "candidate@example.com",
  "fullName": "Jane Doe",
  "phoneNumber": "0712345678"
}

Response:
{
  "success": true,
  "message": "Payment session created successfully.",
  "payment": {
    "id": "...",
    "status": "pending",
    "checkoutUrl": "https://pay.intasend.com/..."
  }
}

### POST /api/payments/stk
Same as /create but forces mpesa.

### POST /api/payments/card
Same as /create but forces card.

### POST /api/payments/webhook
Receives signed webhook payloads from IntaSend.

### GET /api/payments/status/:id
Returns the payment and linked candidate status.

## Environment variables
- INTASEND_PUBLIC_KEY
- INTASEND_SECRET_KEY
- INTASEND_WEBHOOK_SECRET
- APPLICATION_FEE_AMOUNT
- APPLICATION_FEE_CURRENCY
- APPLICATION_FEE_TITLE
