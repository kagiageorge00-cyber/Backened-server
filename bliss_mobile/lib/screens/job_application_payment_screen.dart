import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../widgets/page_card_scaffold.dart';
import '../widgets/brand_loader.dart';

class JobApplicationPaymentScreen extends StatefulWidget {
  final String candidateId;
  final String jobId;

  const JobApplicationPaymentScreen({
    super.key,
    required this.candidateId,
    required this.jobId,
  });

  @override
  State<JobApplicationPaymentScreen> createState() =>
      _JobApplicationPaymentScreenState();
}

class _JobApplicationPaymentScreenState
    extends State<JobApplicationPaymentScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Payment details
  static const String mpesaNumber = '+254798242350';
  static const double mpesaAmount = 1300;
  static const String currency = 'KES';
  static const String bankName = 'Equity Bank';
  static const String bankAccountName = 'Bliss Connect';
  static const String bankAccountNumber = '0640179700069';
  static const String bankAccountDescription =
      'Send Western Union, wire transfer, or MoneyGram funds directly to this account.';

  String _selectedPaymentMethod = 'mpesa';

  // Form controllers
  late TextEditingController _fullNameController;
  late TextEditingController _phoneNumberController;
  late TextEditingController _transactionCodeController;

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController();
    _phoneNumberController = TextEditingController();
    _transactionCodeController = TextEditingController();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneNumberController.dispose();
    _transactionCodeController.dispose();
    super.dispose();
  }

  Future<void> _submitPayment() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // POST simplified payload required by backend
      final response = await http
          .post(
            Uri.parse('${AppConfig.backendUrl}/submitPayment'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'name': _fullNameController.text,
              'phone': _phoneNumberController.text,
              'transactionCode': _transactionCodeController.text,
              'paymentMethod': _selectedPaymentMethod,
              'amount': mpesaAmount,
              'currency': currency,
              'bankAccountName': bankAccountName,
              'bankName': bankName,
              'bankAccountNumber': bankAccountNumber,
            }),
          )
          .timeout(const Duration(seconds: 30));

      setState(() => _isLoading = false);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          _showSuccessDialog();
          return;
        } else {
          String message = responseData['message'] ??
              responseData['error'] ??
              'Payment submission failed';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(message)),
          );
        }
      } else {
        String message = 'Payment submission failed';
        try {
          final errorData = jsonDecode(response.body);
          if (errorData is Map && errorData['message'] != null) {
            message = errorData['message'].toString();
          }
        } catch (_) {
          // non-JSON or empty response body - keep generic message
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('✅ Payment Submitted'),
        content: const Text('Payment submitted. Await confirmation.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // close dialog
              Navigator.of(context).pop(true); // return true to caller
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PageCardScaffold(
      title: 'Job Application Payment',
      body: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Payment amount header
              _buildPaymentHeader(),
              const SizedBox(height: 24),

              // Payment method selection
              _buildPaymentMethodSection(),
              const SizedBox(height: 24),

              // Selected payment details section
              _buildPaymentDetailsSection(),
              const SizedBox(height: 24),

              // Instructions
              _buildInstructionsSection(),
              const SizedBox(height: 24),

              // Form fields
              _buildFormFields(),
              const SizedBox(height: 24),

              // Submit button
              _buildSubmitButton(),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentHeader() {
    final cs = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [cs.primary, cs.primaryContainer],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pay KES 1300',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Job Application Fee',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Payment Method',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        RadioListTile<String>(
          title: const Text('M-Pesa'),
          subtitle: const Text('Mobile money payment'),
          value: 'mpesa',
          groupValue: _selectedPaymentMethod,
          onChanged: (value) {
            setState(() {
              _selectedPaymentMethod = value ?? 'mpesa';
            });
          },
        ),
        RadioListTile<String>(
          title: const Text('Western Union'),
          subtitle: const Text('Send directly to the bank account below'),
          value: 'western_union',
          groupValue: _selectedPaymentMethod,
          onChanged: (value) {
            setState(() {
              _selectedPaymentMethod = value ?? 'western_union';
            });
          },
        ),
        RadioListTile<String>(
          title: const Text('Wire Transfer'),
          subtitle: const Text('Bank wire transfer to the account below'),
          value: 'wire_transfer',
          groupValue: _selectedPaymentMethod,
          onChanged: (value) {
            setState(() {
              _selectedPaymentMethod = value ?? 'wire_transfer';
            });
          },
        ),
        RadioListTile<String>(
          title: const Text('MoneyGram'),
          subtitle:
              const Text('Send via MoneyGram using the bank account details'),
          value: 'moneygram',
          groupValue: _selectedPaymentMethod,
          onChanged: (value) {
            setState(() {
              _selectedPaymentMethod = value ?? 'moneygram';
            });
          },
        ),
      ],
    );
  }

  Widget _buildPaymentDetailsSection() {
    final cs = Theme.of(context).colorScheme;
    String title;
    IconData icon;
    final List<Widget> rows = [];

    switch (_selectedPaymentMethod) {
      case 'western_union':
        title = 'Western Union / Bank Deposit';
        icon = Icons.account_balance;
        rows.addAll([
          _buildDetailRow('Bank Name:', bankName),
          const SizedBox(height: 12),
          _buildDetailRow('Account Name:', bankAccountName),
          const SizedBox(height: 12),
          _buildDetailRow('Account No:', bankAccountNumber),
        ]);
        break;
      case 'wire_transfer':
        title = 'Wire Transfer';
        icon = Icons.swap_horiz;
        rows.addAll([
          _buildDetailRow('Bank Name:', bankName),
          const SizedBox(height: 12),
          _buildDetailRow('Account Name:', bankAccountName),
          const SizedBox(height: 12),
          _buildDetailRow('Account No:', bankAccountNumber),
        ]);
        break;
      case 'moneygram':
        title = 'MoneyGram / Bank Transfer';
        icon = Icons.payment;
        rows.addAll([
          _buildDetailRow('Bank Name:', bankName),
          const SizedBox(height: 12),
          _buildDetailRow('Account Name:', bankAccountName),
          const SizedBox(height: 12),
          _buildDetailRow('Account No:', bankAccountNumber),
        ]);
        break;
      default:
        title = 'M-Pesa Payment';
        icon = Icons.phone_android;
        rows.addAll([
          _buildDetailRow('M-Pesa Number:', mpesaNumber),
          const SizedBox(height: 12),
          _buildDetailRow('Amount:', '$mpesaAmount $currency'),
        ]);
        break;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.secondary.withOpacity(0.08),
        border: Border.all(color: cs.secondary.withOpacity(0.35), width: 2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cs.secondary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: cs.onSecondary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: cs.secondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              border: Border.all(color: cs.secondary.withOpacity(0.25)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(children: rows),
          ),
          if (_selectedPaymentMethod != 'mpesa') ...[
            const SizedBox(height: 12),
            Text(
              bankAccountDescription,
              style: const TextStyle(fontSize: 13, color: Colors.black87),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInstructionsSection() {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.primary.withOpacity(0.06),
        border: Border.all(color: cs.primary.withOpacity(0.18)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, color: cs.primary),
              const SizedBox(width: 8),
              Text(
                'Instructions',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: cs.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Send payment and enter transaction code below',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          _buildStepItem('1', _buildInstructionStepOne()),
          _buildStepItem('2', _buildInstructionStepTwo()),
          _buildStepItem('3', _buildInstructionStepThree()),
          _buildStepItem('4', 'Enter code and your details below'),
        ],
      ),
    );
  }

  Widget _buildStepItem(String step, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary,
              borderRadius: BorderRadius.circular(50),
            ),
            alignment: Alignment.center,
            child: Text(
              step,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                text,
                style: const TextStyle(fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.grey,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildFormFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Your Details',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _fullNameController,
          decoration: InputDecoration(
            labelText: 'Full Name',
            hintText: 'Enter your full name',
            prefixIcon: const Icon(Icons.person),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            filled: true,
            fillColor: Colors.white,
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Full name is required';
            }
            if (value.length < 3) {
              return 'Name must be at least 3 characters';
            }
            return null;
          },
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _phoneNumberController,
          decoration: InputDecoration(
            labelText: 'Phone Number',
            hintText: '254701234567 or +254701234567',
            prefixIcon: const Icon(Icons.phone),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            filled: true,
            fillColor: Colors.white,
          ),
          keyboardType: TextInputType.phone,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Phone number is required';
            }
            if (value.length < 10) {
              return 'Phone number must be at least 10 digits';
            }
            return null;
          },
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _transactionCodeController,
          decoration: InputDecoration(
            labelText: _getTransactionLabel(),
            hintText: _getTransactionHint(),
            prefixIcon: const Icon(Icons.confirmation_number),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            filled: true,
            fillColor: Colors.white,
          ),
          textInputAction: TextInputAction.done,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return '${_getTransactionLabel()} is required';
            }
            if (value.length < 5) {
              return '${_getTransactionLabel()} must be at least 5 characters';
            }
            return null;
          },
        ),
      ],
    );
  }

  String _getTransactionLabel() {
    switch (_selectedPaymentMethod) {
      case 'western_union':
        return 'Western Union Reference';
      case 'wire_transfer':
        return 'Wire Transfer Reference';
      case 'moneygram':
        return 'MoneyGram Reference';
      default:
        return 'M-Pesa Transaction Code';
    }
  }

  String _getTransactionHint() {
    switch (_selectedPaymentMethod) {
      case 'western_union':
        return 'e.g., control number or bank deposit reference';
      case 'wire_transfer':
        return 'e.g., bank transfer reference';
      case 'moneygram':
        return 'e.g., MoneyGram transaction number';
      default:
        return 'e.g., RK7WXYZ9AB';
    }
  }

  String _buildInstructionStepOne() {
    switch (_selectedPaymentMethod) {
      case 'western_union':
        return 'Open Western Union and choose bank deposit to Equity Bank';
      case 'wire_transfer':
        return 'Open your bank app and start a wire transfer to the account below';
      case 'moneygram':
        return 'Open MoneyGram and send funds using the bank account details below';
      default:
        return 'Open M-Pesa on your phone';
    }
  }

  String _buildInstructionStepTwo() {
    switch (_selectedPaymentMethod) {
      case 'western_union':
      case 'wire_transfer':
      case 'moneygram':
        return 'Send payment to Equity Bank using the displayed account details';
      default:
        return 'Send payment to the number shown above';
    }
  }

  String _buildInstructionStepThree() {
    switch (_selectedPaymentMethod) {
      case 'western_union':
        return 'Copy the Western Union control number or bank reference';
      case 'wire_transfer':
        return 'Copy the wire transfer reference number';
      case 'moneygram':
        return 'Copy the MoneyGram transaction number';
      default:
        return 'Copy the transaction code';
    }
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _submitPayment,
        style: ElevatedButton.styleFrom(
          backgroundColor: Theme.of(context).colorScheme.primary,
          disabledBackgroundColor:
              Theme.of(context).colorScheme.primary.withOpacity(0.6),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: _isLoading
            ? Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const BrandLoader(size: 20),
                  const SizedBox(width: 12),
                  const Text(
                    'Processing...',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              )
            : const Text(
                'Submit Payment',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }
}
