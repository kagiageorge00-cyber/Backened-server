import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:bliss_mobile/services/job_application_payment_service.dart';

void main() {
  test('submitPayment posts to the working submit-payment route', () async {
    final calls = <String, dynamic>{};

    final client = MockClient((request) async {
      calls['method'] = request.method;
      calls['url'] = request.url.toString();
      calls['body'] = jsonDecode(request.body);

      return http.Response(
        jsonEncode({
          'success': true,
          'message': 'Payment submitted successfully',
          'paymentId': 'PAY_123',
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    });

    final service = JobApplicationPaymentService(
      baseUrl: 'https://example.test',
      client: client,
    );

    final result = await service.submitPayment(
      candidateId: 'cand_1',
      jobId: 'job_1',
      fullName: 'Test User',
      phoneNumber: '+254700000000',
      email: 'applicant@example.com',
      paymentMethod: 'mpesa',
      amount: 1300,
      transactionCode: 'RK7WXYZ9AB',
    );

    expect(result['success'], isTrue);
    expect(calls['method'], 'POST');
    expect(calls['url'], 'https://example.test/api/submitPayment');
    expect(calls['body']['name'], 'Test User');
    expect(calls['body']['phone'], '+254700000000');
    expect(calls['body']['email'], 'applicant@example.com');
    expect(calls['body']['transactionCode'], 'RK7WXYZ9AB');
    expect(calls['body']['paymentMethod'], 'mpesa');
    expect(calls['body']['amount'], 1300);
  });
}
