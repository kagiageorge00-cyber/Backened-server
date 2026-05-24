# Visa & Travel Solutions - Complete Integration Guide

## Overview
The Visa & Travel Solutions module is the central hub for three critical services:
1. **Visa Applications** - Visa service with Firestore tracking
2. **Flight Bookings** - Amadeus API integration for real flight searches
3. **Bliss Holidays** - Amadeus API integration for hotel bookings

---

## Architecture Overview

```
VisaTicketProcessingScreen (Home Hub)
├── Visa Application
│   ├── VisaApplicationForm
│   └── Firestore: visa_applications collection
├── Flight & Tickets  
│   ├── TicketBookingScreen
│   ├── AmadeusService (searchFlights)
│   └── Firebase Functions: /flightSearch endpoint
└── Holiday Packages
    ├── HolidayPackagesScreen
    ├── AmadeusService (searchHotels)
    └── Firebase Functions: /hotelSearch endpoint
```

---

## 1. VISA APPLICATION MODULE ✅

### Location
- **Screen**: `lib/screens/visa_application_form_screen.dart`
- **Service**: `lib/services/visa_service.dart`
- **Firestore Collection**: `visa_applications`

### Supported Visa Types
- Work Visa
- Tourist Visa
- Visit Visa
- Student Visa
- Residence Visa
- Business Visa

### Visa Pricing (from visa_service.dart)
```
tourist_standard: $50
tourist_rush: $100
student_standard: $75
student_rush: $150
work_standard: $150
work_rush: $250
business_standard: $100
business_rush: $200
```

### Visa Destination Countries (Supported)
- United Arab Emirates
- Saudi Arabia
- Qatar
- Kuwait
- Oman
- Bahrain
- Turkey
- Canada
- USA
- United Kingdom

### Visa Application Flow
1. Candidate enters full name, passport number, phone
2. Selects destination country from dropdown
3. Selects visa type (determines fee)
4. Submits application
5. Stored in Firestore `visa_applications` collection
6. Candidate receives confirmation
7. Application moves to `pending` status

### Data Structure (Firestore)
```json
{
  "fullName": "John Doe",
  "passportNumber": "A12345678",
  "phone": "+254700123456",
  "country": "United Arab Emirates",
  "visaType": "Work Visa",
  "notes": "Optional notes",
  "createdAt": "timestamp",
  "status": "pending" // pending, approved, rejected
}
```

---

## 2. FLIGHT BOOKING MODULE ✅

### Location
- **Screen**: `lib/screens/ticket_booking_screen.dart`
- **Service**: `lib/services/amadeus_service.dart`
- **Backend**: `functions/flightSearch.js`
- **API**: Firebase Functions `/flightSearch` endpoint

### Amadeus API Integration
**Configured to use:**
- Real Amadeus APIs (Sandbox for testing, Production ready)
- Token management with 30-minute expiration handling
- Automatic token refresh
- Error handling with retry logic

### Flight Search Parameters
```dart
AmadeusService.searchFlights({
  required String origin,           // e.g., "JFK"
  required String destination,      // e.g., "LAX"
  required String departureDate,    // "YYYY-MM-DD"
  int adults = 1,                   // Number of adult passengers
  int children = 0,                 // Number of children
  int infants = 0,                  // Number of infants
})
```

### Supported Airports (Airport Code Examples)
- **Nairobi**: NBO
- **Dubai**: DXB
- **London**: LHR
- **New York**: JFK/LGA
- **Los Angeles**: LAX
- **Paris**: CDG
- **Singapore**: SIN
- **Tokyo**: NRT

### Flight Booking Flow
1. **Search**: Enter origin, destination, departure date, passengers
2. **Results**: Display real Amadeus flight offers (up to 10 results)
3. **Selection**: Customer selects preferred flight
4. **Insurance & Upsells**: 
   - Insurance options (3 tiers)
   - Upsells: seat upgrades, luggage, priority boarding, etc.
5. **Pricing Breakdown**:
   - Base price (from Amadeus)
   - Platform fee (10%)
   - Insurance cost (customer choice)
   - Upsell costs
6. **Payment**: Process via Flutterwave/M-PESA/PayPal
7. **Booking Confirmation**: Generate booking reference

### Pricing Calculation
```dart
basePrice = flightOffer.price;
platformFee = basePrice * 0.10;  // 10% platform fee
insuranceCost = selectedInsurance.price;
upsellsCost = selectedUpsells.map(u => u.price).reduce((a,b) => a+b);
totalPrice = basePrice + platformFee + insuranceCost + upsellsCost;

// bliss profit:
blissProfit = platformFee + (insuranceCost * 0.60) + (upsellsCost * 0.40);
amadeusCost = basePrice + (insuranceCost * 0.40);
```

### Insurance Options Available
- **Basic**: KES 500 (Covers delays only)
- **Standard**: KES 1,500 (Covers delays + cancellation)
- **Premium**: KES 3,000 (Full coverage + medical)

### Available Upsells
- Seat upgrade (Business/Premium)
- Extra luggage (20kg)
- Priority boarding
- Meal service
- Travel insurance add-on
- Airport transfer

### Data Stored (Firestore)
```json
{
  "bookingId": "FL_123456",
  "candidateId": "C123456",
  "flightDetails": {
    "departureAirport": "NBO",
    "arrivalAirport": "DXB",
    "departureTime": "2026-03-20T14:30:00Z",
    "arrivalTime": "2026-03-20T22:15:00Z",
    "airline": "Emirates",
    "flightNumber": "EK504",
    "aircraft": "B777",
    "baseFare": 50000,
    "currency": "KES"
  },
  "passengers": {
    "adults": 1,
    "children": 0,
    "infants": 0
  },
  "pricing": {
    "basePrice": 50000,
    "platformFee": 5000,
    "insurance": "standard",
    "insuranceCost": 1500,
    "upsells": ["seat_upgrade", "luggage"],
    "upsellsCost": 3500,
    "totalPrice": 60000
  },
  "status": "payment_verified",
  "bookingDate": "timestamp",
  "paymentMethod": "flutterwave"
}
```

---

## 3. BLISS HOLIDAYS (HOTEL PACKAGES) MODULE ✅

### Location
- **Screen**: `lib/screens/holiday_packages_screen.dart`
- **Service**: `lib/services/amadeus_service.dart`
- **Backend**: `functions/flightSearch.js` (contains hotel search)
- **API**: Firebase Functions `/hotelSearch` endpoint

### Amadeus Hotel API Integration
**Configured to use:**
- Real Amadeus hotel APIs
- City code conversion
- Multi-date search (check-in to check-out)
- Occupancy configuration

### Hotel Search Parameters
```dart
AmadeusService.searchHotels({
  required String city,          // e.g., "Dubai"
  required String checkInDate,   // "YYYY-MM-DD"
  required String checkOutDate,  // "YYYY-MM-DD"
  int adults = 1,                // Number of guests
})
```

### Supported Cities (Hotel Search)
- Dubai (DXB)
- Cairo (CAI)
- Bangkok (BKK)
- Paris (CDG)
- London (LHR)
- Singapore (SIN)
- Tokyo (NRT)
- New York (NYC)
- Barcelona (BCN)
- Amsterdam (AMS)

### Holiday Package Booking Flow
1. **Search**: Enter city, check-in, check-out dates
2. **Results**: Display real Amadeus hotels (up to 10 results)
   - Hotel name, rating, price per night
   - Available room types
3. **Selection**: Customer selects preferred hotel
4. **Guest Details**: Collect name, email, phone
5. **Insurance & Upsells**:
   - Travel insurance (2 tiers)
   - Upsells: airport transfer, tour packages, activities
6. **Pricing Breakdown**:
   - Hotel nightly rate
   - Total nights × rate
   - Platform fee (10%)
   - Insurance & activities
7. **Payment**: Process via Flutterwave/M-PESA/PayPal
8. **Confirmation**: Email booking with details

### Pricing Calculation
```dart
nightsCount = checkOutDate.difference(checkInDate).inDays;
roomPrice = hotelOffer.price;
totalHotelCost = roomPrice * nightsCount;
platformFee = totalHotelCost * 0.10;
insuranceCost = selectedInsurance.price;
upsellsCost = selectedUpsells.map(u => u.price).reduce((a,b) => a+b);
totalPrice = totalHotelCost + platformFee + insuranceCost + upsellsCost;

// bliss profit:
blissProfit = platformFee + (insuranceCost * 0.60) + (upsellsCost * 0.40);
hotelCost = totalHotelCost + (insuranceCost * 0.40);
```

### Insurance Options Available
- **Standard**: KES 500 (Cancellation coverage)
- **Premium**: KES 1,500 (Full coverage + medical)

### Available Upsells
- Airport transfer (KES 2,500)
- City tour package (KES 5,000)
- Activities & excursions (KES 3,000-10,000)
- Meal plans (breakfast, half-board, full-board)
- Spa & wellness package (KES 2,000)
- Concierge services

### Data Stored (Firestore)
```json
{
  "bookingId": "HOL_654321",
  "candidateId": "C123456",
  "hotelDetails": {
    "hotelName": "Luxe Dubai Beach Resort",
    "city": "Dubai",
    "rating": 4.5,
    "address": "Beach Road, Dubai",
    "checkInDate": "2026-04-01",
    "checkOutDate": "2026-04-05",
    "nightsCount": 4,
    "roomType": "Deluxe"
  },
  "guestDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+254700123456"
  },
  "pricing": {
    "nightly": 15000,
    "nights": 4,
    "hotelCost": 60000,
    "platformFee": 6000,
    "insurance": "premium",
    "insuranceCost": 1500,
    "upsells": ["airport_transfer", "city_tour"],
    "upsellsCost": 7500,
    "totalPrice": 75000
  },
  "status": "payment_verified",
  "bookingDate": "timestamp",
  "paymentMethod": "flutterwave"
}
```

---

## Amadeus API Configuration

### Firebase Functions Setup
**File**: `functions/flightSearch.js`

```javascript
const amadeusInstance = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET
});
```

### Environment Variables Required
```
AMADEUS_CLIENT_ID=<your-client-id>
AMADEUS_CLIENT_SECRET=<your-client-secret>
```

### Firebase Functions Endpoints
All endpoints protected with API key validation:

1. **Flight Search**
   - Endpoint: `/flightSearch`
   - Method: POST
   - Returns: Array of flight offers (up to 10)

2. **Hotel Search**
   - Endpoint: `/hotelSearch`
   - Method: POST
   - Returns: Array of hotel offers (up to 10)

3. **City Search**
   - Endpoint: `/citiesSearch`
   - Method: POST
   - Returns: Array of cities matching keyword

---

## Payment Integration

### All Three Modules Support
- **M-PESA**: Paybill 600100, Account 0100011879308
- **Flutterwave**: Card payments, bank transfers, mobile money
- **PayPal**: International payments

### Payment Flow
1. Customer reviews total price
2. Selects payment method
3. Processes payment via unified payment dialog
4. Firestore records payment metadata
5. Booking confirmed via email/SMS
6. Status set to "payment_verified"

---

## User Experience Flow

### Candidate Journey

**Step 1**: Open app → Navigate to Visa & Travel Solutions
**Step 2**: Choose module:
- **Visa Application**: Fill form → Submit → Get confirmation
- **Flight Booking**: Search → Select → Add insurance/upsells → Pay → Confirmation
- **Holidays**: Search → Select → Enter guest details → Add insurance/upsells → Pay → Confirmation

**Step 3**: Receive:
- Transaction ID
- Booking reference
- Email confirmation with details
- SMS reminder (optional)

**Step 4**: Track:
- View booking status in dashboard
- Download receipt/invoice
- Contact support if needed

---

## Testing Checklist

### Visa Application
- [ ] Submit application with all required fields
- [ ] Verify Firestore record created
- [ ] Check confirmation message displayed
- [ ] Test server-side validation

### Flight Booking
- [ ] Search flights with valid origin/destination
- [ ] Verify Amadeus data returns (not mock)
- [ ] Select flight and complete booking
- [ ] Test insurance selection
- [ ] Test upsells addition
- [ ] Verify pricing calculation
- [ ] Complete payment
- [ ] Check Firestore booking record

### Holiday Packages
- [ ] Search hotels with valid city/dates
- [ ] Verify Amadeus hotel data returns
- [ ] Select hotel and enter guest details
- [ ] Test insurance selection
- [ ] Test upsells addition
- [ ] Verify pricing calculation
- [ ] Complete payment
- [ ] Check Firestore booking record

---

## Troubleshooting

### Flight/Hotel Search Returns Empty
1. Check Amadeus API credentials in Firebase Functions
2. Verify request parameters (dates, codes)
3. Check Firebase Functions logs
4. Ensure API key in functions/index.js is correct

### Payment Not Processing
1. Check payment method selected
2. Verify Flutterwave API keys
3. Check M-PESA paybill configuration
4. Review payment_helper.dart implementation

### Booking Not Appearing in Firestore
1. Check Firebase Firestore permissions
2. Verify Firestore collection names
3. Check browser console for errors
4. Review financial_reconciliation_service.dart

---

## Performance Optimization

### Caching
- Amadeus tokens cached (30-min expiration)
- City search results cached locally
- Hotel availability cache (1 hour)

### Error Handling
- Retry logic for failed API calls
- Fallback error messages
- Comprehensive logging

### Security
- API key validation on all endpoints
- HTTPS encryption
- PCI DSS compliance for payments
- Data sanitization

---

## Summary

✅ **All Three Modules Fully Integrated**
- Visa Application ← Firestore
- Flight Booking ← Amadeus API + Firebase Functions
- Bliss Holidays ← Amadeus API + Firebase Functions

✅ **Payment Processing**
- M-PESA, Flutterwave, PayPal supported
- Real-time verification
- Profit tracking

✅ **User Experience**
- Modern UI with module selection
- Detailed search & booking flows
- Insurance & upsell options
- Payment confirmation & tracking
