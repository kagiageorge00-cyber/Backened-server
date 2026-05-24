import 'package:flutter/material.dart';
import 'package:bliss_mobile/services/financial_reconciliation_service.dart';
import 'package:bliss_mobile/services/auth_service.dart';
import 'package:bliss_mobile/models/user_role.dart';

class FinancialDashboardScreen extends StatefulWidget {
  const FinancialDashboardScreen({super.key});

  @override
  State<FinancialDashboardScreen> createState() =>
      _FinancialDashboardScreenState();
}

class _FinancialDashboardScreenState extends State<FinancialDashboardScreen> {
  bool isLoading = true;
  bool isAuthorized = false;
  FinancialSummary? summary;
  List<Settlement> pendingSettlements = [];
  String? errorMessage;
  final _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _checkAuthorizationAndLoadData();
  }

  Future<void> _checkAuthorizationAndLoadData() async {
    setState(() => isLoading = true);
    try {
      final user = await _authService.getCurrentUserAsync();
      
      if (user == null) {
        setState(() {
          errorMessage = 'User not authenticated. Please login.';
          isLoading = false;
        });
        return;
      }

      if (user.role != UserRole.admin) {
        setState(() {
          errorMessage = '❌ Access Denied: Only admins can view this dashboard.';
          isLoading = false;
          isAuthorized = false;
        });
        return;
      }

      setState(() => isAuthorized = true);
      await _loadFinancialData();
    } catch (e) {
      setState(() {
        errorMessage = 'Authorization error: $e';
        isLoading = false;
      });
    }
  }

  Future<void> _loadFinancialData() async {
    setState(() => isLoading = true);
    try {
      final summ = await FinancialReconciliationService.getFinancialSummary();
      final settlements =
          await FinancialReconciliationService.getPendingSettlements();

      setState(() {
        summary = summ;
        pendingSettlements = settlements;
        errorMessage = null;
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Error loading financial data: $e';
      });
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('💰 Financial Dashboard'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.deepPurple,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage != null
              ? Center(
                  child: Text(
                    errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadFinancialData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSummaryCards(),
                          const SizedBox(height: 24),
                          _buildSettlementsSection(),
                          const SizedBox(height: 24),
                          _buildActionButtons(),
                        ],
                      ),
                    ),
                  ),
                ),
    );
  }

  Widget _buildSummaryCards() {
    if (summary == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '📊 Financial Summary',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            _buildStatCard(
              title: 'Bookings',
              value: summary!.totalBookings.toString(),
              subtitle: 'Paid: ${summary!.paidBookings}',
              icon: '✈️',
              color: Colors.blue,
            ),
            _buildStatCard(
              title: 'Customer Payments',
              value: '${summary!.currency} ${summary!.totalCustomerPayments.toStringAsFixed(0)}',
              subtitle: '${summary!.paidBookings} confirmed',
              icon: '💳',
              color: Colors.green,
            ),
            _buildStatCard(
              title: 'Your Profit',
              value: '${summary!.currency} ${summary!.totalYourProfit.toStringAsFixed(0)}',
              subtitle: '${summary!.profitMargin.toStringAsFixed(1)}% margin',
              icon: '📈',
              color: Colors.orange,
            ),
            _buildStatCard(
              title: 'Amadeus Payable',
              value: '${summary!.currency} ${summary!.totalAmadeusOwed.toStringAsFixed(0)}',
              subtitle: 'Unsettled: ${summary!.currency} ${summary!.totalUnsettled.toStringAsFixed(0)}',
              icon: '🏦',
              color: Colors.red,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String subtitle,
    required String icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color, width: 2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$icon $title',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettlementsSection() {
    if (pendingSettlements.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.blue),
        ),
        child: const Text(
          '✓ No pending settlements. All settled!',
          style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '📋 Pending Settlements',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.orange,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '${pendingSettlements.length}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: pendingSettlements.length,
          itemBuilder: (context, index) {
            final settlement = pendingSettlements[index];
            return _buildSettlementCard(settlement);
          },
        ),
      ],
    );
  }

  Widget _buildSettlementCard(Settlement settlement) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    settlement.settlementPeriod,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${settlement.bookingIds.length} bookings',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${settlement.currency} ${settlement.totalYourProfit.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getStatusColor(settlement.status).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    settlement.status.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: _getStatusColor(settlement.status),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSettlementDetail(
                  'Period',
                  settlement.settlementPeriod,
                ),
                const Divider(),
                _buildSettlementDetail(
                  'Total Bookings',
                  settlement.bookingIds.length.toString(),
                ),
                const Divider(),
                _buildSettlementDetail(
                  'Platform Fees',
                  '${settlement.currency} ${settlement.totalPlatformFee.toStringAsFixed(2)}',
                ),
                const SizedBox(height: 4),
                _buildSettlementDetail(
                  'Insurance Profit (60%)',
                  '${settlement.currency} ${settlement.totalInsuranceProfit.toStringAsFixed(2)}',
                ),
                const SizedBox(height: 4),
                _buildSettlementDetail(
                  'Upsells Profit (40%)',
                  '${settlement.currency} ${settlement.totalUpsellsProfit.toStringAsFixed(2)}',
                ),
                const Divider(),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        '✓ Your Total Earnings',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '${settlement.currency} ${settlement.totalYourProfit.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        '⚠️ Owed to Amadeus',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '${settlement.currency} ${settlement.totalAmadeusCost.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (settlement.status == 'pending') ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _showSubmitDialog(settlement),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.amber,
                      ),
                      child: const Text('📤 Submit to Amadeus'),
                    ),
                  ),
                ] else if (settlement.status == 'submitted') ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _showMarkPaidDialog(settlement),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                      ),
                      child: const Text('✓ Mark as Paid'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettlementDetail(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
        ),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '⚙️ Actions',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _createNewSettlement,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.deepPurple,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text(
              '🔄 Create Weekly Settlement',
              style: TextStyle(fontSize: 16),
            ),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _loadFinancialData,
            child: const Text('🔃 Refresh Data'),
          ),
        ),
      ],
    );
  }

  void _showSubmitDialog(Settlement settlement) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Submit Settlement to Amadeus'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Settlement Period: ${settlement.settlementPeriod}',
            ),
            const SizedBox(height: 8),
            Text(
              'Total Owed: ${settlement.currency} ${settlement.totalAmadeusCost.toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const Text('Invoice ID will be generated automatically.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              await FinancialReconciliationService.submitSettlement(
                settlementId: settlement.id,
                invoiceId:
                    'INV-${settlement.id.substring(0, 8).toUpperCase()}',
              );
              if (mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('✓ Settlement submitted!')),
                );
                _loadFinancialData();
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  void _showMarkPaidDialog(Settlement settlement) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Payment Received'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Invoice: ${settlement.invoiceId}',
            ),
            const SizedBox(height: 8),
            Text(
              'Amount: ${settlement.currency} ${settlement.totalAmadeusCost.toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const Text('Mark this settlement as paid from Amadeus.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              await FinancialReconciliationService.markSettlementPaid(
                settlementId: settlement.id,
                paidDate: DateTime.now(),
              );
              if (mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('✓ Settlement marked as reconciled!')),
                );
                _loadFinancialData();
              }
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  Future<void> _createNewSettlement() async {
    try {
      final settlement =
          await FinancialReconciliationService.createWeeklySettlement();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '✓ Settlement created: ${settlement.currency} ${settlement.totalYourProfit.toStringAsFixed(2)} profit',
          ),
          backgroundColor: Colors.green,
        ),
      );
      _loadFinancialData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'submitted':
        return Colors.blue;
      case 'reconciled':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
}
