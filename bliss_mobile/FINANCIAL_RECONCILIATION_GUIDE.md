# Complete Financial Reconciliation System Documentation

## System Overview

This is a complete 3-layer financial system that tracks:
1. **Customer Payments** → Your Platform Account
2. **Your Profit** → Kept by Bliss Mobile
3. **Amadeus Payments** → Sent to Amadeus

```
CUSTOMER PAYS
    ↓
YOUR STRIPE/FLUTTERWAVE ACCOUNT (holds full $)
    ↓
    ├─→ YOU KEEP (your profit: platform fee + insurance + upsells)
    └─→ AMADEUS OWES (base price: flight/hotel cost)
```

---

## Payment Flow Architecture

### Step 1: Customer Books a Flight/Hotel

**Files Involved:**
- `lib/screens/ticket_booking_screen.dart`
- `lib/screens/holiday_packages_screen.dart`

**What Happens:**
```
User clicks "Book" → Shows Insurance & Upsells Modal
  ↓
User confirms → Pricing is calculated
  ↓
Booking saved to Firestore (flight_bookings / hotel_bookings)
  ↓
SIMULTANEOUSLY:
- Payment metadata recorded
- Amadeus payable tracked
```

### Step 2: Create Payment Metadata

**File:** `lib/services/financial_reconciliation_service.dart`

**Method:** `recordPaymentMetadata()`

```dart
// Records how much was paid, your profit, and what's owed to Amadeus
PaymentMetadata {
  bookingId: "flight_123",
  totalAmount: 645,       // Customer pays this
  basePrice: 400,         // Goes to Amadeus
  platformFee: 48,        // You keep this
  insurancePrice: 32,     // You keep 60% = $19.20
  upsellsPrice: 165,      // You keep 40% = $66
  yourProfit: 133.20,     // Your total cut
  status: "pending",
  amadeusSettled: false
}
```

### Step 3: Track Amadeus Payables

**Firestore Collection:** `amadeus_payables`

**Daily Record Example:**
```json
{
  "date": "2026-03-09",
  "metadataIds": ["meta_1", "meta_2", "meta_3"],
  "totalOwed": 1200,      // Total flights/hotels to pay
  "currency": "USD",
  "status": "unpaid",
  "invoiceId": null
}
```

**Purpose:**
- Track daily what you owe Amadeus
- Group payments for batch processing
- Generate invoices

### Step 4: Process Payment (When Customer Pays)

**Method:** `markPaymentPaid()`

```dart
// Called after successful Stripe/Flutterwave payment
await FinancialReconciliationService.markPaymentPaid(
  metadataId: "meta_123",
  transactionId: "txn_xxxx"
);
```

**This:**
✓ Updates payment status to "paid"
✓ Records transaction ID
✓ Creates/updates Amadeus payable record
✓ Tracks what you owe

### Step 5: Create Weekly Settlement

**Method:** `createWeeklySettlement()`

**Automatic process each week:**
1. Fetches all unpaid bookings from past 7 days
2. Sums up your profits by category
3. Calculates total owed to Amadeus
4. Creates settlement record
5. Marks payments as settled

**Settlement Record Example:**
```json
{
  "id": "settlement_456",
  "period": "2026-03-01 to 2026-03-07",
  "totalBookings": 25,
  "paymentIds": ["meta_1", "meta_2", ...],
  
  "breakdown": {
    "platformFees": 450,           // Your commission
    "insuranceProfits": 380,       // Your 60% cut
    "upsellsProfits": 240          // Your 40% cut
  },
  
  "totalYourProfit": 1070,         // YOU KEEP THIS
  "totalAmadeusCost": 8000,        // YOU OWE THIS
  "totalCustomerPayments": 9070,   // Total received
  
  "status": "pending"              // Not submitted yet
}
```

### Step 6: Submit Settlement to Amadeus

**Method:** `submitSettlement()`

```dart
// Admin/Finance team submits the settlement
await FinancialReconciliationService.submitSettlement(
  settlementId: "settlement_456",
  invoiceId: "INV-SETTLEMENT456"  // Track for invoice
);
```

**Result:**
- Status changes from "pending" → "submitted"
- Invoice ID recorded for Amadeus
- Invoice sent to Amadeus with all payment details

**Invoice Shows:**
```
BLISS MOBILE SETTLEMENT INVOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Period: 2026-03-01 to 2026-03-07
Bookings: 25

Payment Due to Amadeus:
  Base flight/hotel costs: USD 8,000.00
  
Invoice ID: INV-SETTLEMENT456
Payment Terms: Due within 7 days
```

### Step 7: Reconcile Payment

**Method:** `markSettlementPaid()`

```dart
// After Amadeus payment is received
await FinancialReconciliationService.markSettlementPaid(
  settlementId: "settlement_456",
  paidDate: DateTime.now()
);
```

**Result:**
- Settlement marked as "reconciled"
- All cleared from payables
- Can run final audit

---

## Firestore Collections Structure

### 1. `flight_bookings` (User Facing)
```json
{
  "name": "John Doe",
  "flight_base_price": 400,
  "platform_fee": 48,
  "insurance": [...],
  "total_amount": 645,
  "status": "pending_payment"
}
```

### 2. `hotel_bookings` (User Facing)
```json
{
  "guest_name": "Jane Smith",
  "hotel_base_price": 200,
  "platform_fee": 30,
  "total_amount": 350,
  "status": "pending_payment"
}
```

### 3. `payment_metadata` (Financial Tracking)
```json
{
  "bookingId": "flight_123",
  "bookingType": "flight",
  "totalAmount": 645,
  "basePrice": 400,
  "platformFee": 48,
  "insurancePrice": 32,
  "upsellsPrice": 165,
  "status": "pending",
  "paidAt": null,
  "amadeusSettled": false
}
```

### 4. `amadeus_payables` (Daily Tracking)
```json
{
  "date": "2026-03-09",
  "metadataIds": ["meta_1", "meta_2"],
  "totalOwed": 600,
  "status": "unpaid",
  "invoiceId": null
}
```

### 5. `settlements` (Weekly Reports)
```json
{
  "period": "2026-03-01 to 2026-03-07",
  "totalBookings": 25,
  "paymentIds": [...],
  "totalPlatformFee": 450,
  "totalInsuranceProfit": 380,
  "totalUpsellsProfit": 240,
  "totalYourProfit": 1070,
  "totalAmadeusCost": 8000,
  "status": "pending",
  "invoiceId": "INV-SETTLEMENT456"
}
```

---

## Admin Dashboard

**File:** `lib/screens/admin/financial_dashboard_screen.dart`

**Features:**

### 1. Financial Summary Cards
```
┌─────────────────────────────────┐
│ ✈️ Bookings      │ 💳 Payments   │
│ Total: 125      │ Total: $15,250│
│ Paid: 98        │ Confirmed: 98 │
├─────────────────────────────────┤
│ 📈 Your Profit  │ 🏦 Amadeus    │
│ Total: $3,200   │ Owed: $12,000 │
│ Margin: 21%     │ Unsettled: $400│
└─────────────────────────────────┘
```

### 2. Pending Settlements List
- Shows all settlements waiting to submit
- Click to see breakdown
- Submit to Amadeus
- Mark as paid when received

### 3. Action Buttons
- Create Weekly Settlement (automatic)
- Refresh Data
- View detailed reports

---

## Complete Money Flow Example

### Scenario: Customer Books Flight + Insurance + Seat Upgrade

**Step 1: Pricing Calculation**
```
Flight base cost:        $400
Your platform fee (10%): $40
Insurance (8% of base):  $32
Seat upgrade:            $45

Customer pays:           $517
```

**Step 2: Record Booking**
```
flight_bookings collection:
{
  flight_base_price: 400,
  platform_fee: 40,
  insurance: 32,
  upsells: 45,
  total_amount: 517
}
```

**Step 3: Payment Metadata**
```
payment_metadata collection:
{
  totalAmount: 517,
  basePrice: 400,
  platformFee: 40,
  insurancePrice: 32,
  upsellsPrice: 45,
  
  yourProfit: 40 + (32 × 0.60) + (45 × 0.40)
           = 40 + 19.20 + 18
           = $77.20
}
```

**Step 4: Customer Pays $517**
```
✓ Payment received in your Stripe account
✓ markPaymentPaid() called
✓ Status: "pending" → "paid"
```

**Step 5: Amadeus Payable Created**
```
amadeus_payables[2026-03-09]:
{
  metadataIds: ["meta_123"],
  totalOwed: 400,  // Only base price
  status: "unpaid"
}
```

**Step 6: Week Ends - Create Settlement**
```
Settlement includes:
- 25 similar bookings from this week
- Your total profit: $1,930
- Amadeus owes: $10,000

settlement document:
{
  yourProfit: 1930,
  amadeusCost: 10000,
  invoiceId: "INV-ABC123"
}
```

**Step 7: Send Invoice to Amadeus**
```
Invoice shows: "You owe us $10,000 for 25 bookings"
Amadeus pays via bank transfer
```

**Step 8: Mark as Reconciled**
```
Settlement status: "reconciled"
Your accounting is complete
```

---

## Profit Summary

### Your Revenue Sources:

**1. Platform Fees**
- Flights: $8 + 10% of base price
- Hotels: 15% of base price

**2. Insurance (60% margin)**
- Customer buys $32 insurance
- You keep: $19.20

**3. Upsells (40% margin)**
- Customer buys $45 seat upgrade  
- You keep: $18

**Example Monthly (100 bookings):**
```
Platform Fees:     $2,400
Insurance Profit:    $800
Upsells Profit:      $600
━━━━━━━━━━━━━━━━━━━━━━
YOUR TOTAL:        $3,800/month

Amadeus Payable:  $40,000/month
Customer Paid:    $43,800/month
```

---

## API Integration Points

### When Payment is Received:

1. **Stripe Webhook** → `markPaymentPaid()`
2. **Flutterwave Callback** → `markPaymentPaid()`
3. **Manual Payment** → `markPaymentPaid()`

```dart
// Example: Stripe confirmation
onPaymentSuccess: (paymentResult) {
  FinancialReconciliationService.markPaymentPaid(
    metadataId: bookingId,
    transactionId: paymentResult.id
  );
}
```

### Weekly Automation (use Cloud Functions):

```javascript
// Firebase Cloud Function (runs every Sunday)
exports.createWeeklySettlement = functions
  .pubsub.schedule('0 0 ? * SUN')
  .onRun(async (context) => {
    // Call Dart function that triggers Firebase function
    await db.collection('triggers')
      .doc('settlement_trigger')
      .set({ type: 'create_settlement' });
  });
```

---

## Audit Trail

All transactions are tracked:
```
payment_metadata → shows what customer paid
amadeus_payables → shows what you owe
settlements → shows reconciliation
```

Complete transparency for:
- Accounting
- Tax purposes
- Amadeus disputes
- Profit analysis

---

## Next Steps

To use this system:

1. **Integrate Payment Processor**
   - Hook Stripe/Flutterwave confirmation to `markPaymentPaid()`

2. **Access Financial Dashboard**
   - Add route to `financial_dashboard_screen.dart`
   - Requires admin authentication

3. **Set Up Weekly Settlements**
   - Manual: Admin clicks button weekly
   - Automated: Firebase Cloud Function

4. **Send Invoices to Amadeus**
   - Download invoice from dashboard
   - Send via email
   - Track payment

5. **Reconcile Once Paid**
   - Mark settlement as paid
   - Audit is complete

---

## Questions & Support

For implementation questions:
- Check `financial_reconciliation_service.dart` for all methods
- Review `financial_dashboard_screen.dart` for UI examples
- Test with demo bookings before going live
