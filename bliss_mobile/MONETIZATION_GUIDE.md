# Bliss Mobile - Monetization System Documentation

## Overview
Complete profit generation system with multiple revenue streams:
- Flight booking markups
- Hotel booking markups  
- Travel insurance (60% profit margin)
- Upsells/Add-ons (40% profit margin)

---

## Revenue Structure

### 1️⃣ FLIGHT BOOKINGS

**Base Profit Calculation:**
- **Fixed Fee**: $8 per flight
- **Percentage Markup**: 10% of base price
- **Total = Base Price + (10% × Base Price) + $8**

**Example:**
- Flight cost: $400
- Markup: (10% × $400) + $8 = $40 + $8 = $48
- **Customer pays: $448** ✓ Platform profit: $48

**Insurance Options:**
```
- Basic Flight Protection: 5% of flight price
- Premium Flight Shield: 8% of flight price  
- Platinum Traveler Insurance: 12% of flight price
```

**Upsells Available:**
- Premium Seat Upgrade: $45
- Business Class Upgrade: $299
- Extra Luggage (23kg): $35
- Overweight Bag (32kg): $60
- Airport Transfer: $50
- VIP Car Service: $120

---

### 2️⃣ HOTEL BOOKINGS

**Base Profit Calculation:**
- **Percentage Markup**: 15% of base price
- **Total = Base Price + (15% × Base Price)**

**Example:**
- Hotel cost: $200/night × 5 nights = $1,000
- Markup: 15% × $1,000 = $150
- **Customer pays: $1,150** ✓ Platform profit: $150

**Insurance Options:**
```
- Hotel Protection Plan: 4% of hotel price
- Deluxe Stay Guard: 7% of hotel price
```

**Upsells Available:**
- Airport Transfer: $50
- City Tour: $99
- Adventure Activity: $150
- Spa & Wellness Package: $200
- Fine Dining Package: $180

---

## Profit Margins

### Platform Commission (Your Revenue):
```
Flight Markup = 10% + $8 fixed
Hotel Markup = 15%
Insurance = 60% of insurance price
Upsells = 40% of upsell price
```

### Example Complete Booking:

**Flight Booking:**
- Base: $400
- Flight markup: $48
- Insurance (Premium): $32 → Profit: $19.20
- Seat upgrade: $45 → Profit: $18
- VIP Transfer: $120 → Profit: $48
- **TOTAL PROFIT: $133.20**
- **Profit margin: 23.8%**

**Hotel Booking:**
- Base: $1,000 (5 nights)
- Hotel markup: $150
- Insurance: $70 → Profit: $42
- Spa Package: $200 → Profit: $80
- **TOTAL PROFIT: $272**
- **Profit margin: 21.4%**

---

## Implementation Details

### Services Created:

#### `lib/services/pricing_service.dart`
```dart
// Main pricing calculations
PricingService.calculateFlightPrice()
PricingService.calculateHotelPrice()
PricingService.calculateTotal()
PricingService.getProfitAnalytics()
```

### Updated Screens:

#### `lib/screens/ticket_booking_screen.dart`
- Search flights (real Amadeus data)
- Show flight details with pricing breakdown
- Insurance selection (3 tiers)
- Upsells modal (6 options)
- Final pricing summary
- Booking with all details to Firestore

#### `lib/screens/holiday_packages_screen.dart`
- Search hotels (real Amadeus data)
- Guest details collection
- Insurance selection (2 tiers)
- Upsells modal (5 options)
- Final pricing summary
- Booking with all details to Firestore

---

## Firestore Collections

### `flight_bookings`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "country": "United Arab Emirates",
  "flight_id": "amadeus_1",
  "flight_base_price": 400,
  "platform_fee": 48,
  "insurance": [
    {
      "id": "flight_premium",
      "name": "Premium Flight Shield",
      "price": 32
    }
  ],
  "upsells": [
    {
      "id": "seat_upgrade_premium",
      "name": "Premium Seat Upgrade",
      "price": 45
    },
    {
      "id": "transfer_vip",
      "name": "VIP Car Service",
      "price": 120
    }
  ],
  "pricing_breakdown": {
    "basePrice": 400,
    "platformFee": 48,
    "insurancePrice": 32,
    "upsellsPrice": 165,
    "totalPrice": 645,
    "currency": "USD",
    "profitMargin": 133.2
  },
  "total_amount": 645,
  "currency": "USD",
  "profit_margin": 133.2,
  "status": "pending_payment",
  "created_at": "2026-03-09T10:30:00Z"
}
```

### `hotel_bookings`
```json
{
  "guest_name": "Jane Smith",
  "guest_email": "jane@example.com",
  "guest_phone": "+254712345678",
  "hotel_id": "amadeus_hotel_1",
  "hotel_name": "Luxe Dubai Resort",
  "check_in": "2026-04-10",
  "check_out": "2026-04-15",
  "nights": 5,
  "hotel_base_price": 1000,
  "platform_fee": 150,
  "insurance": [
    {
      "id": "hotel_deluxe",
      "name": "Deluxe Stay Guard",
      "price": 70
    }
  ],
  "upsells": [
    {
      "id": "activity_spa",
      "name": "Spa & Wellness Package",
      "price": 200
    }
  ],
  "pricing_breakdown": {
    "basePrice": 1000,
    "platformFee": 150,
    "insurancePrice": 70,
    "upsellsPrice": 200,
    "totalPrice": 1420,
    "currency": "USD",
    "profitMargin": 272
  },
  "total_amount": 1420,
  "currency": "USD",
  "profit_margin": 272,
  "status": "pending_payment",
  "created_at": "2026-03-09T11:15:00Z"
}
```

---

## Dashboard Analytics Query

To get total platform profit:

```dart
// Get monthly profit
final bookings = await FirebaseFirestore.instance
    .collection('flight_bookings')
    .where('created_at', isGreaterThan: startDate)
    .where('created_at', isLessThan: endDate)
    .get();

double totalProfit = 0;
for (var booking in bookings.docs) {
  totalProfit += booking['profit_margin'] ?? 0;
}

// Same for hotel_bookings
```

---

## Future Monetization Ideas

1. **Dynamic Pricing** - Higher markup during peak seasons
2. **VIP Membership** - Premium users get discounts (you still profit)
3. **Flight Comparison** - Show competitor prices, user saves money, you profit
4. **Loyalty Points** - Users earn points redeemable for discounts
5. **Corporate Partnerships** - Airlines/Hotels offer higher commissions
6. **Advertising** - Show partner ads in search results
7. **Payment Processing Fees** - Additional 2-3% fee

---

## Summary

✅ **Flights**: $8 + 10% = Avg $40-60 per booking  
✅ **Hotels**: 15% = Avg $100-200 per booking  
✅ **Insurance**: 60% margin = Avg $15-40 per booking  
✅ **Upsells**: 40% margin = Avg $20-100 per booking  

**Monthly Revenue Target:**
- 1,000 flight bookings: ~$50,000
- 500 hotel bookings: ~$75,000
- Insurance & Upsells: ~$35,000
- **TOTAL: ~$160,000/month** (at scale)

All profit data is stored in Firestore for analytics and reporting! 🎉
