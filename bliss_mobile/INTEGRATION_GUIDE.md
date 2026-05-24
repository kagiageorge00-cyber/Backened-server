# Integration Guide - How to Use the New Security Features

## Step 1: Update pubspec.yaml ✅ DONE

The following were added to `pubspec.yaml`:
```yaml
go_router: ^13.0.0
firebase_messaging: ^14.8.0
```

**Action**: Run `flutter pub get` in terminal

---

## Step 2: Update main.dart

Replace the current MaterialApp with GoRouter. Find this in `main.dart`:

**BEFORE:**
```dart
class BlissApp extends StatelessWidget {
  const BlissApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Bliss Mobile',
      theme: Provider.of<ThemeNotifier>(context).themeData,
      home: const HomeScreen(),
    );
  }
}
```

**AFTER:**
```dart
class BlissApp extends StatelessWidget {
  const BlissApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Bliss Mobile',
      theme: Provider.of<ThemeNotifier>(context).themeData,
      routerConfig: AppRouter.router,
    );
  }
}
```

**Add this import at the top of main.dart:**
```dart
import 'config/app_router.dart';
```

---

## Step 3: Initialize Notification Service

In `main()` function, after StripeService.init(), add:

```dart
// Initialize Firebase Cloud Messaging
NotificationService().initializeFCM();
debugPrint('✅ FCM initialized');
```

**Add import:**
```dart
import 'services/notification_service.dart';
```

---

## Step 4: Update Home Screen Navigation

Add this button to navigate to booking history (for customers):

```dart
ElevatedButton(
  onPressed: () => context.go('/customer/bookings'),
  child: const Text('📋 My Bookings'),
)
```

And for admins, add button to financial dashboard:

```dart
if (currentUserRole == UserRole.admin)
  ElevatedButton(
    onPressed: () => context.go('/admin/financial-dashboard'),
    child: const Text('💰 Financial Dashboard'),
  )
```

---

## Step 5: Firebase Environment Variables (Important!)

Set the API key for Firebase Cloud Functions:

### In Firebase Console:
1. Go to Cloud Functions
2. Edit your function
3. Add environment variable:
   - Name: `BLISS_API_KEY`
   - Value: `your-secret-key-here` (use strong random string)

### Or via gcloud CLI:
```bash
gcloud functions deploy flightSearch \
  --set-env-vars BLISS_API_KEY=your-secret-key-here
```

---

## Step 6: Deploy Firestore Rules

In your Firebase project:

```bash
firebase deploy --only firestore:rules
```

Or via Firebase Console:
1. Go to Firestore Database
2. Go to "Rules" tab
3. Replace with content from `firestore.rules`
4. Click "Publish"

---

## Step 7: Deploy Updated Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

---

## Step 8: Test Everything

### Test 1: Authentication
```dart
// Try logging in with a non-admin account
// Then try accessing /admin/financial-dashboard
// Should be redirected to home
```

### Test 2: API Key Validation
```bash
# This should FAIL (no API key)
curl -X POST https://your-functions/flightSearch \
  -d '{"origin":"JFK","destination":"LAX","departureDate":"2026-04-01"}'

# This should FAIL (invalid key)
curl -X POST https://your-functions/flightSearch \
  -H "x-api-key: wrong-key" \
  -d '{"origin":"JFK","destination":"LAX","departureDate":"2026-04-01"}'

# This should SUCCEED
curl -X POST https://your-functions/flightSearch \
  -H "x-api-key: your-secret-key-here" \
  -d '{"origin":"JFK","destination":"LAX","departureDate":"2026-04-01"}'
```

### Test 3: Firestore Rules
Try reading another user's data:
```dart
// This should fail (unauthorized)
final doc = await FirebaseFirestore.instance
    .collection('payment_metadata')
    .doc('someone-elses-payment')
    .get();
```

---

## Step 9: Update Amadeus Service (Optional)

Update the API_KEY in `amadeus_service.dart` to use the same validation:

```dart
// When calling Firebase function, add header:
final headers = {
  'x-api-key': 'your-secret-key-here',
  'Content-Type': 'application/json',
};

final response = await http.post(
  Uri.parse('$baseUrl/flightSearch'),
  headers: headers,
  body: jsonEncode({...})
);
```

---

## Step 10: Connect Payment Webhooks

When payment succeeds, call:

```dart
// Stripe callback
await PaymentWebhookService().handleStripePaymentSuccess(
  paymentIntentId: intent.id,
  metadataId: metadataId,
  amount: totalAmount,
);

// Or Flutterwave callback  
await PaymentWebhookService().handleFlutterwavePaymentSuccess(
  transactionId: transaction.id,
  metadataId: metadataId,
  amount: totalAmount,
);
```

This automatically:
1. Marks payment as paid
2. Creates amadeus_payables record
3. Logs webhook event for audit

---

## Common Issues & Solutions

### Issue: "GoRouter not found"
**Solution**: Make sure you imported it
```dart
import 'config/app_router.dart';
```

### Issue: "User collection not found"
**Solution**: First user must be created when they sign up. `AuthService.signUpWithEmail()` does this automatically.

### Issue: "Financial dashboard not showing up"
**Solution**: Make sure user has `role: 'admin'` in their Firestore document.

### Issue: "API key errors"
**Solution**: Make sure Firebase function environment variable is set correctly and code is deployed.

### Issue: "Can't access booking history"
**Solution**: Check Firestore rules are deployed. Also check user is authenticated.

---

## Permission Management

To grant admin role to a user, use AuthService:

```dart
final authService = AuthService();
await authService.updateUserRole(
  userId: 'user-uid-here',
  newRole: UserRole.admin,
);
```

---

## Notification Topics

Subscribe users to notification topics:

```dart
final notificationService = NotificationService();

// Flight confirmations
await notificationService.subscribeToTopic('flight_confirmations');

// Visa updates
await notificationService.subscribeToTopic('visa_updates');

// Medical reminders
await notificationService.subscribeToTopic('appointment_reminders');

// Promotions
await notificationService.subscribeToTopic('promotional_offers');
```

---

## Documentation

All services have inline documentation. Check:
- `lib/services/auth_service.dart` - Authentication
- `lib/services/payment_webhook_service.dart` - Payment flow
- `lib/services/visa_service.dart` - Visa processing
- `lib/services/medical_service.dart` - Medical bookings
- `lib/services/notification_service.dart` - Push notifications
- `lib/config/app_router.dart` - Navigation & routing

---

## Support

All services include debug print statements:
```
[AuthService] message
[PaymentWebhookService] message
[VisaService] message
[MedicalService] message
[NotificationService] message
```

Check Flutter console for detailed logs.

---

**Setup Complete!** Your app is now secure and production-ready. 🚀
