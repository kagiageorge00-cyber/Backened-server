# Visa, Flight & Holidays - Complete System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  BLISS MOBILE APPLICATION                       │
│                  (Flutter - Dart)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │    VISA      │  │   FLIGHT     │  │   HOTELS     │
        │ APPLICATION  │  │   BOOKING    │  │  (HOLIDAYS)  │
        └──────────────┘  └──────────────┘  └──────────────┘
                │             │             │
                └─────────────┼─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  PAYMENT HELPER   │
                    │  (M-PESA, FW,PP)  │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
    ┌────────┐         ┌──────────────┐      ┌──────────────┐
    │ M-PESA │         │  FLUTTERWAVE │      │    PAYPAL    │
    │        │         │              │      │              │
    │Paybill │         │ Card/Mobile  │      │ International│
    │600100  │         │ Money        │      │ Payments     │
    └────────┘         └──────────────┘      └──────────────┘

                    ┌──────────────────────┐
                    │   FIREBASE           │
                    │   ┌──────────────┐   │
                    │   │ Firestore    │   │
                    │   │ Collections: │   │
                    │   │ • visa_apps  │   │
                    │   │ • flights    │   │
                    │   │ • hotels     │   │
                    │   │ • payments   │   │
                    │   └──────────────┘   │
                    │                      │
                    │   ┌──────────────┐   │
                    │   │  Functions   │   │
                    │   │ • flightArc  │   │
                    │   │ • hotelArc   │   │
                    │   │ • cityArc    │   │
                    │   └──────────────┘   │
                    └──────────────────────┘

                      ┌────────────────┐
                      │   AMADEUS API  │
                      │   (Real Data)  │
                      │ • Flights      │
                      │ • Hotels       │
                      │ • Cities       │
                      └────────────────┘
```

---

## Module Architecture

### 1. VISA APPLICATION MODULE

```
┌─────────────────────────────────────┐
│  VisaApplicationForm Screen          │
│  (lib/screens/...)                   │
│                                       │
│  • Form Input                         │
│    - Full Name                        │
│    - Passport Number                  │
│    - Phone                            │
│    - Destination Country              │
│    - Visa Type                        │
│                                       │
│  • Pricing                            │
│    - Visa Fee (visa_pricing map)      │
│    - Rush Processing (+50%)           │
│                                       │
│  • Payment Integration                │
│    - PaymentHelper.showPaymentDialog()│
│                                       │
│  • Firestore Save                     │
│    - Collection: visa_applications    │
│    - Status: payment_verified         │
└────────────────────┬──────────────────┘
                     │
        ┌────────────▼────────────┐
        │  PaymentHelper Utility  │
        │  (lib/utils/...)        │
        │                         │
        │  • Show payment dialog  │
        │  • Process payment      │
        │  • Return success/null  │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Payment Providers      │
        │                         │
        │  1. M-PESA              │
        │     └─ Instant payment  │
        │                         │
        │  2. Flutterwave         │
        │     └─ Card/Mobile      │
        │                         │
        │  3. PayPal              │
        │     └─ International    │
        └────────────────────────┘
```

### 2. FLIGHT BOOKING MODULE with Amadeus

```
┌──────────────────────────────────────┐
│  TicketBookingScreen                  │
│  (lib/screens/...)                    │
│                                        │
│  Step 1: Search Form                  │
│  ├─ Origin: NBO (default)             │
│  ├─ Destination: (user selects)       │
│  ├─ Departure Date                    │
│  └─ Passengers: (1 adult default)     │
│                                        │
│  Step 2: Search Results               │
│  └─ AmadeusService.searchFlights()    │
│     └─ Returns: List<FlightOffer>     │
│                                        │
│  Step 3: Flight Selection             │
│  ├─ Display flight details            │
│  ├─ Show base price (from Amadeus)    │
│  ├─ Insurance options                 │
│  │  ├─ Basic: $50                     │
│  │  ├─ Standard: $150                 │
│  │  └─ Premium: $300                  │
│  └─ Upsells                           │
│     ├─ Seat upgrade                   │
│     ├─ Luggage                        │
│     ├─ Meals                          │
│     └─ Services                       │
│                                        │
│  Step 4: Pricing Calculation          │
│  ├─ Base Price (Amadeus)              │
│  ├─ Platform Fee (10%)                │
│  ├─ Insurance Cost                    │
│  └─ Upsells Total                     │
│     = TOTAL AMOUNT                    │
│                                        │
│  Step 5: Payment                      │
│  └─ PaymentHelper.showPaymentDialog()│
│                                        │
│  Step 6: Save to Firestore            │
│  └─ Collection: flight_bookings       │
│     ├─ flight_details (Amadeus data)  │
│     ├─ pricing_breakdown              │
│     ├─ status: payment_verified       │
│     └─ profit_margin                  │
│                                        │
│  Step 7: Financial Tracking           │
│  └─ FinancialReconciliationService    │
│     ├─ Record Amadeus payable         │
│     ├─ Calculate profit               │
│     └─ Track settlement               │
└──────────────────┬─────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   AmadeusService    │
        │  (lib/services/...) │
        │                     │
        │  searchFlights()    │
        │  searchCities()     │
        │  searchHotels()     │
        │                     │
        │  Returns:           │
        │  • FlightOffer      │
        │  • Hotel            │
        │  • City             │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────┐
        │  Firebase Functions     │
        │  (functions/...)        │
        │                         │
        │  /flightSearch          │
        │  /hotelSearch           │
        │  /citiesSearch          │
        │                         │
        │  Token Management:      │
        │  • OAuth2 at startup    │
        │  • 30-min expiration    │
        │  • Auto-refresh         │
        └──────────┬──────────────┘
                   │
        ┌──────────▼──────────────┐
        │   Amadeus API           │
        │   (Real Flight Data)    │
        │                         │
        │   Returns:              │
        │   • Flight offers       │
        │   • Prices (real)       │
        │   • Airlines            │
        │   • Schedules           │
        └─────────────────────────┘
```

### 3. HOTEL BOOKING MODULE with Amadeus

```
┌──────────────────────────────────────┐
│  HolidayPackagesScreen               │
│  (lib/screens/...)                    │
│                                        │
│  Step 1: Search Form                  │
│  ├─ City Selection                    │
│  │  ├─ Dubai                          │
│  │  ├─ Nairobi                        │
│  │  ├─ Riyadh                         │
│  │  ├─ Doha                           │
│  │  └─ Muscat                         │
│  ├─ Check-in Date                     │
│  └─ Check-out Date                    │
│                                        │
│  Step 2: Search Results               │
│  └─ AmadeusService.searchHotels()    │
│     └─ Returns: List<Hotel>           │
│                                        │
│  Step 3: Hotel Selection              │
│  ├─ Display hotel details             │
│  ├─ Rating & reviews                  │
│  ├─ Room types                        │
│  ├─ Nightly price (from Amadeus)      │
│  ├─ Insurance options                 │
│  │  ├─ Standard: $50                  │
│  │  └─ Premium: $150                  │
│  └─ Upsells                           │
│     ├─ Airport transfer               │
│     ├─ City tours                     │
│     ├─ Activities                     │
│     ├─ Meals plans                    │
│     ├─ Spa & wellness                 │
│     └─ Concierge                      │
│                                        │
│  Step 4: Guest Details                │
│  ├─ Guest Name                        │
│  ├─ Guest Email                       │
│  └─ Guest Phone                       │
│                                        │
│  Step 5: Pricing Calculation          │
│  ├─ Nightly Rate × Nights             │
│  ├─ Platform Fee (10%)                │
│  ├─ Insurance Cost                    │
│  └─ Upsells Total                     │
│     = TOTAL AMOUNT                    │
│                                        │
│  Step 6: Payment                      │
│  └─ PaymentHelper.showPaymentDialog()│
│                                        │
│  Step 7: Save to Firestore            │
│  └─ Collection: hotel_bookings        │
│     ├─ hotel_details (Amadeus data)   │
│     ├─ guest_details                  │
│     ├─ pricing_breakdown              │
│     ├─ status: payment_verified       │
│     └─ profit_margin                  │
│                                        │
│  Step 8: Financial Tracking           │
│  └─ FinancialReconciliationService    │
│     ├─ Record Amadeus payable         │
│     ├─ Calculate profit               │
│     └─ Track settlement               │
└──────────────────┬─────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   AmadeusService    │
        │  (lib/services/...) │
        │                     │
        │  searchHotels()     │
        │  searchCities()     │
        │                     │
        │  Returns:           │
        │  • Hotel list       │
        │  • Hotel data       │
        │  • Prices           │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────┐
        │  Firebase Functions     │
        │  (functions/...)        │
        │                         │
        │  /hotelSearch           │
        │  /citiesSearch          │
        │                         │
        │  Token Management:      │
        │  • OAuth2 at startup    │
        │  • 30-min expiration    │
        │  • Auto-refresh         │
        └──────────┬──────────────┘
                   │
        ┌──────────▼──────────────┐
        │   Amadeus API           │
        │   (Real Hotel Data)     │
        │                         │
        │   Returns:              │
        │   • Hotel offers        │
        │   • Prices (real)       │
        │   • Room types          │
        │   • Availability        │
        └─────────────────────────┘
```

---

## Data Flow Diagrams

### Visa Application Flow

```
User Input
    │
    ▼
Form Validation
    │
    ├─ Name, Passport, Phone required
    ├─ Country must be selected
    └─ Visa Type must be selected
    │
    ▼
Calculate Pricing
    │
    ├─ Look up visa_pricing[visaType]
    ├─ Apply rush multiplier if checked
    └─ Result: totalCost
    │
    ▼
Display Pricing Summary
    │
    └─ Show breakdown before payment
    │
    ▼
Create Firestore Record
    │
    ├─ Add all form data
    ├─ Add pricing data
    ├─ Set status: "pending_payment"
    └─ Get docRef.id
    │
    ▼
Show Payment Dialog
    │
    ├─ PaymentHelper.showPaymentDialog()
    ├─ User selects M-PESA/Flutterwave/PayPal
    ├─ Process payment
    └─ Result: success (bool) or null
    │
    ▼
Decision: Payment Successful?
    │
    ├─ YES ──→ Update status to "payment_verified"
    │          └─ Add payment_date timestamp
    │          └─ Show confirmation with reference
    │          └─ Reset form
    │
    └─ NO  ──→ Delete Firestore record
               └─ Show "Payment cancelled" message
```

### Flight Booking Flow

```
User Search
    │
    ├─ Enter destination
    ├─ Enter departure date
    └─ Set passengers count
    │
    ▼
Call Amadeus API
    │
    ├─ AmadeusService.searchFlights()
    ├─ Firebase Function: /flightSearch
    ├─ Token management (OAuth2)
    └─ Returns: real flight data
    │
    ▼
Display Results
    │
    └─ Show 10 best flight options
    │
    ▼
User Select Flight
    │
    ├─ Get FlightOffer details
    ├─ Extract base price from Amadeus
    └─ Show insurance/upsell options
    │
    ▼
Calculate Total
    │
    ├─ basePrice (from Amadeus)
    ├─ platformFee = basePrice × 10%
    ├─ insurancePrice (selected)
    ├─ upsellsPrice (selected)
    └─ totalPrice = base + platform + insurance + upsells
    │
    ▼
Create Firestore Records
    │
    ├─ flight_bookings
    │  ├─ All flight details (from Amadeus)
    │  ├─ All pricing breakdown
    │  ├─ Insurance details
    │  ├─ Upsells details
    │  ├─ status: "pending_payment"
    │  └─ Get bookingRef.id
    │
    └─ amadeus_payables (via FinancialReconciliationService)
       ├─ Amount owed to Amadeus
       └─ Detailed breakdown
    │
    ▼
Show Payment Dialog
    │
    ├─ PaymentHelper.showPaymentDialog()
    ├─ Reference: FLIGHT_{bookingRef.id}
    ├─ User selects payment method
    ├─ Process payment
    └─ Result: success or null
    │
    ▼
Decision: Payment Successful?
    │
    ├─ YES ──→ Update flight_bookings
    │          ├─ status: "payment_verified"
    │          └─ Add payment_date timestamp
    │          └─ Show confirmation with reference
    │
    └─ NO  ──→ Delete booking record
               └─ Show "Payment cancelled" message
```

### Hotel Booking Flow

```
User Search
    │
    ├─ Select city
    ├─ Enter check-in date
    └─ Enter check-out date
    │
    ▼
Call Amadeus API
    │
    ├─ AmadeusService.searchHotels()
    ├─ Firebase Function: /hotelSearch
    ├─ Token management (OAuth2)
    └─ Returns: real hotel data
    │
    ▼
Display Results
    │
    └─ Show 10 best hotel options
    │
    ▼
User Select Hotel & Enter Guest Details
    │
    ├─ Get Hotel details
    ├─ Enter guest name
    ├─ Enter guest email
    ├─ Enter guest phone
    └─ Show insurance/upsell options
    │
    ▼
Calculate Total
    │
    ├─ nightly (from Amadeus)
    ├─ nights = checkOut - checkIn
    ├─ hotelCost = nightly × nights
    ├─ platformFee = hotelCost × 10%
    ├─ insurancePrice (selected)
    ├─ upsellsPrice (selected)
    └─ totalPrice = hotel + platform + insurance + upsells
    │
    ▼
Create Firestore Records
    │
    ├─ hotel_bookings
    │  ├─ All hotel details (from Amadeus)
    │  ├─ Guest details (name, email, phone)
    │  ├─ Dates (check-in, check-out, nights)
    │  ├─ All pricing breakdown
    │  ├─ Insurance details
    │  ├─ Upsells details
    │  ├─ status: "pending_payment"
    │  └─ Get bookingRef.id
    │
    └─ amadeus_payables (via FinancialReconciliationService)
       ├─ Amount owed to Amadeus
       └─ Detailed breakdown
    │
    ▼
Show Payment Dialog
    │
    ├─ PaymentHelper.showPaymentDialog()
    ├─ Reference: HOTEL_{bookingRef.id}
    ├─ User selects payment method
    ├─ Process payment
    └─ Result: success or null
    │
    ▼
Decision: Payment Successful?
    │
    ├─ YES ──→ Update hotel_bookings
    │          ├─ status: "payment_verified"
    │          └─ Add payment_date timestamp
    │          └─ Show confirmation with reference
    │
    └─ NO  ──→ Delete booking record
               └─ Show "Payment cancelled" message
```

---

## Firestore Collection Structure

### visa_applications
```
├─ Document ID: auto-generated
│
├─ Fields:
│  ├─ full_name (String)
│  ├─ passport_number (String)
│  ├─ phone (String)
│  ├─ country (String)
│  ├─ visa_type (String)
│  ├─ notes (String - optional)
│  ├─ visa_fee (double)
│  ├─ is_rush_processing (boolean)
│  ├─ total_cost (double)
│  ├─ currency (String: "USD")
│  ├─ created_at (Timestamp)
│  ├─ status (String: "pending_payment" or "payment_verified")
│  └─ payment_date (Timestamp - if paid)
```

### flight_bookings
```
├─ Document ID: auto-generated
│
├─ Fields:
│  ├─ name (String)
│  ├─ email (String)
│  ├─ phone (String)
│  ├─ country (String)
│  ├─ depart_date (Date)
│  ├─ return_date (Date - if return)
│  ├─ is_return (boolean)
│  ├─ flight_id (String)
│  ├─ flight_base_price (double)
│  ├─ platform_fee (double)
│  │
│  ├─ insurance (Array of Objects)
│  │  ├─ id (String)
│  │  ├─ name (String)
│  │  └─ price (double)
│  │
│  ├─ upsells (Array of Objects)
│  │  ├─ id (String)
│  │  ├─ name (String)
│  │  └─ price (double)
│  │
│  ├─ pricing_breakdown (Object)
│  ├─ total_amount (double)
│  ├─ currency (String: "KES")
│  ├─ profit_margin (double)
│  ├─ created_at (Timestamp)
│  ├─ status (String: "pending_payment" or "payment_verified")
│  └─ payment_date (Timestamp - if paid)
```

### hotel_bookings
```
├─ Document ID: auto-generated
│
├─ Fields:
│  ├─ guest_name (String)
│  ├─ guest_email (String)
│  ├─ guest_phone (String)
│  ├─ hotel_id (String)
│  ├─ hotel_name (String)
│  ├─ check_in (Date)
│  ├─ check_out (Date)
│  ├─ nights (Number)
│  ├─ hotel_base_price (double)
│  ├─ platform_fee (double)
│  │
│  ├─ insurance (Array of Objects)
│  │  ├─ id (String)
│  │  ├─ name (String)
│  │  └─ price (double)
│  │
│  ├─ upsells (Array of Objects)
│  │  ├─ id (String)
│  │  ├─ name (String)
│  │  └─ price (double)
│  │
│  ├─ pricing_breakdown (Object)
│  ├─ total_amount (double)
│  ├─ currency (String: "KES")
│  ├─ profit_margin (double)
│  ├─ created_at (Timestamp)
│  ├─ status (String: "pending_payment" or "payment_verified")
│  └─ payment_date (Timestamp - if paid)
```

---

## Service Integration

### AmadeusService
- **Purpose**: Real flight and hotel searches via Amadeus API
- **Methods**:
  - `searchFlights(origin, destination, departureDate, adults)`
  - `searchHotels(city, checkInDate, checkOutDate, adults)`
  - `searchCities(keyword)`
- **Returns**: Real data (not mock)
- **Token Management**: Automatic OAuth2 refresh

### PaymentHelper
- **Purpose**: Unified payment interface
- **Methods**:
  - `showPaymentDialog(context, amount, description, reference)`
- **Providers**:
  - M-PESA (Instant)
  - Flutterwave (1-2 min)
  - PayPal (5-10 min)
- **Returns**: bool (success) or null (cancelled)

### PricingService
- **Purpose**: Calculate pricing with insurance and upsells
- **Methods**:
  - `calculateTotal(basePrice, selectedInsurance, selectedUpsells, isHotel)`
  - `getFlightInsuranceOptions(basePrice)`
  - `getHotelInsuranceOptions(basePrice)`
  - `getFlightUpsells()`
  - `getHotelUpsells()`
- **Returns**: `BookingTotal` object with breakdown

### FinancialReconciliationService
- **Purpose**: Track costs, profits, and settlements
- **Methods**:
  - `recordPaymentMetadata(...)`
  - `recordAmadeusPayable(...)`
- **Collections**:
  - `amadeus_payables`
  - `settlements`
  - `flight_bookings`
  - `hotel_bookings`

---

## Security Considerations

1. **API Keys**: Stored in Firebase Functions environment
2. **Payment Gateway**: Secured via HTTPS/TLS
3. **Firestore Rules**: Restrict booking access
4. **Token Management**: OAuth2 with auto-refresh
5. **Data Validation**: Server-side validation
6. **Error Handling**: No sensitive data in error messages

---

## Performance Optimization

1. **Caching**: Tokens cached for 30 minutes
2. **Search Results**: Cached locally (1 hour)
3. **Lazy Loading**: Hotels/flights loaded on demand
4. **Image Optimization**: Compressed hotel images
5. **Database Indexing**: Firestore composite indexes for queries

---

## Monitoring & Logging

### What to Monitor
1. **Payment Success Rate**: % of successful transactions
2. **Amadeus API Uptime**: Response times and availability
3. **Firestore Performance**: Query latency and costs
4. **Error Rates**: Failed payments and booking errors
5. **User Flow Completion**: Completion rates for each module

### Log Locations
1. **Firebase Functions**: Cloud Functions logs
2. **Firestore**: Database logs
3. **PaymentHelper**: Transaction logs
4. **AmadeusService**: API response logs

---

## Deployment Requirements

### Backend (Firebase)
- Cloud Functions with Node.js runtime
- Firestore database with security rules
- Environment variables for API keys

### Frontend (Flutter/Dart)
- Payment packages (payment_helper.dart)
- Amadeus packages (amadeus_service.dart)
- Firebase packages (cloud_firestore)

### External Services
- Amadeus API account (Sandbox + Production)
- M-PESA business account
- Flutterwave merchant account
- PayPal business account

---

## Support & Troubleshooting

### Common Issues

**Issue**: "Payment dialog doesn't appear"
- **Solution**: Check PaymentHelper imports and build configuration

**Issue**: "Amadeus API returns no results"
- **Solution**: Verify API credentials in Firebase Functions
- **Solution**: Check airport/city codes are correct

**Issue**: "Firestore not saving bookings"
- **Solution**: Verify Firestore security rules allow write access
- **Solution**: Check Firebase initialization

**Issue**: "Payment succeeds but status doesn't update"
- **Solution**: Verify payment callback handling in _finalizeBooking
- **Solution**: Check Firestore permissions

---

## System Status

✅ **Visa Application Module**: Complete with payment integration
✅ **Flight Booking Module**: Complete with Amadeus + payment integration  
✅ **Hotel Booking Module**: Complete with Amadeus + payment integration
✅ **Payment Processing**: Multi-method support (M-PESA, Flutterwave, PayPal)
✅ **Financial Tracking**: Complete reconciliation system
✅ **Production Ready**: All modules tested and documented

---

**Last Updated**: Phase 3 Completion
**Next Review**: After first production transactions
