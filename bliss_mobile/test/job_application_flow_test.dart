import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bliss_mobile/main_apply.dart';

void main() {
  testWidgets('Job Application Flow smoke test', (WidgetTester tester) async {
    // Build the app
    await tester.pumpWidget(const BlissApp());

    // Navigate to job application page (update with actual navigation if needed)
    // Example: tap on a button or menu to open job application
    final Finder applyJobButton = find.text('Apply for Job');
    expect(applyJobButton, findsOneWidget);
    await tester.tap(applyJobButton);
    await tester.pumpAndSettle();

    // Fill in required fields (update with actual field labels or keys)
    await tester.enterText(find.byType(TextFormField).at(0), 'Test User');
    await tester.enterText(
        find.byType(TextFormField).at(1), 'testuser@example.com');
    await tester.enterText(find.byType(TextFormField).at(2), '0712345678');
    // ...add more fields as needed

    // Submit the application
    final Finder submitButton = find.text('Submit');
    expect(submitButton, findsOneWidget);
    await tester.tap(submitButton);
    await tester.pumpAndSettle();

    // Check for confirmation dialog or success message
    expect(
        find.textContaining('application has been submitted'), findsOneWidget);
  });
}
