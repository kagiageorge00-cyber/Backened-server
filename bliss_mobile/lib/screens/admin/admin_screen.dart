import 'package:flutter/material.dart';
import '../../services/admin_service.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  List candidates = [];
  List pendingPayments = [];
  bool loading = false;
  String? error;
  bool showMarketplace = false;
  bool isLoggedIn = AdminService.isLoggedIn();

  @override
  void initState() {
    super.initState();
    if (isLoggedIn) {
      fetchCandidates();
    }
  }

  // ======================
  // ADMIN LOGIN
  // ======================
  Future<void> adminLogin(String username, String password) async {
    setState(() => loading = true);

    final success = await AdminService.adminLogin(username, password);

    setState(() => loading = false);

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("❌ Invalid credentials. Use: boss / boss123")),
      );
      return;
    }

    setState(() => isLoggedIn = true);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("✅ Login successful")),
    );

    await fetchCandidates();
  }

  // ======================
  // ADMIN LOGOUT
  // ======================
  Future<void> adminLogout() async {
    await AdminService.adminLogout();
    setState(() => isLoggedIn = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("✅ Logged out")),
    );
  }

  // ======================
  // LOAD DATA
  // ======================
  Future<void> fetchCandidates() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      final data = await AdminService.getCandidates();

      if (data.isEmpty && !AdminService.isLoggedIn()) {
        // Token might have expired
        setState(() {
          isLoggedIn = false;
          loading = false;
        });
        return;
      }

      final pending = await AdminService.getPendingPayments();

      print("📦 Candidates: $data");
      print("💰 Pending Payments: $pending");

      setState(() {
        candidates = data;
        pendingPayments = pending;
      });
    } catch (e) {
      print("❌ ERROR FETCHING: $e");
      setState(() {
        error = "Failed to load candidates";
      });
    } finally {
      setState(() => loading = false);
    }
  }

  // ======================
  // APPROVE PAYMENT (FIXED)
  // ======================
  Future<void> approvePayment(String paymentId) async {
    print("🚀 Sending approval for: $paymentId");

    final ok = await AdminService.approvePayment(paymentId);

    print("✅ Response: $ok");

    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Approval failed')),
      );
      if (!AdminService.isLoggedIn()) {
        setState(() => isLoggedIn = false);
      }
      return;
    }

    await fetchCandidates();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('✅ Payment approved. Candidate can continue.'),
      ),
    );
  }

  // ======================
  // VERIFY USER
  // ======================
  Future<void> verifyUser(String phone) async {
    final success = await AdminService.verifyUser(phone);

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("❌ Verification failed")),
      );
      if (!AdminService.isLoggedIn()) {
        setState(() => isLoggedIn = false);
      }
      return;
    }

    await fetchCandidates();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("✅ User verified")),
    );
  }

  // ======================
  // UPDATE STATUS
  // ======================
  Future<void> updateStatus(String phone, String status) async {
    final success = await AdminService.updateStatus(phone, status);

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("❌ Update failed")),
      );
      if (!AdminService.isLoggedIn()) {
        setState(() => isLoggedIn = false);
      }
      return;
    }

    await fetchCandidates();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("✅ Status updated → $status")),
    );
  }

  // ======================
  // UI
  // ======================
  @override
  Widget build(BuildContext context) {
    if (!isLoggedIn) {
      return _buildLoginScreen();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Admin Panel"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: fetchCandidates,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: adminLogout,
          )
        ],
      ),
      body: _buildBody(),
    );
  }

  // ======================
  // LOGIN SCREEN
  // ======================
  Widget _buildLoginScreen() {
    final usernameController = TextEditingController();
    final passwordController = TextEditingController();

    return Scaffold(
      appBar: AppBar(title: const Text("Admin Login")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                const Icon(Icons.admin_panel_settings,
                    size: 80, color: Colors.blue),
                const SizedBox(height: 20),
                const Text(
                  "Admin Panel",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 30),
                TextField(
                  controller: usernameController,
                  decoration: InputDecoration(
                    labelText: "Username",
                    hintText: "boss",
                    prefixIcon: const Icon(Icons.person),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: "Password",
                    hintText: "••••••••",
                    prefixIcon: const Icon(Icons.lock),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: loading
                        ? null
                        : () {
                            final username = usernameController.text.trim();
                            final password = passwordController.text;

                            if (username.isEmpty || password.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text("Please enter credentials")),
                              );
                              return;
                            }

                            adminLogin(username, password);
                          },
                    child: loading
                        ? const CircularProgressIndicator()
                        : const Text("Login", style: TextStyle(fontSize: 18)),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  "Enter your admin username and password.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(error!),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: fetchCandidates,
              child: const Text("Retry"),
            )
          ],
        ),
      );
    }

    if (candidates.isEmpty && pendingPayments.isEmpty) {
      return const Center(child: Text("No candidates found"));
    }

    return RefreshIndicator(
      onRefresh: fetchCandidates,
      child: ListView(
        children: [
          // TOP TOGGLE: Overview / Marketplace
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          showMarketplace ? Colors.white : Colors.blue,
                      foregroundColor:
                          showMarketplace ? Colors.black : Colors.white,
                      elevation: showMarketplace ? 0 : 4,
                    ),
                    onPressed: () => setState(() => showMarketplace = false),
                    child: const Text('Overview'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          showMarketplace ? Colors.blue : Colors.white,
                      foregroundColor:
                          showMarketplace ? Colors.white : Colors.black,
                      elevation: showMarketplace ? 4 : 0,
                    ),
                    onPressed: () => setState(() => showMarketplace = true),
                    child: const Text('Marketplace'),
                  ),
                ),
              ],
            ),
          ),

          // MARKETPLACE VIEW
          if (showMarketplace) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
              child: Text(
                'Candidates Marketplace',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: GridView.builder(
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.78,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                ),
                itemCount: candidates.length,
                itemBuilder: (context, index) {
                  final c = candidates[index];
                  final name = c['name'] ?? 'No name';
                  final photo = c['photoUrl'] ?? 'assets/images/logo.png';
                  final skills = (c['skills'] is List)
                      ? (c['skills'] as List).join(', ')
                      : (c['skills'] ?? '—');
                  final exp = c['experience'] ?? '';
                  final verified = c['isVerified'] == true;

                  return Card(
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 6,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(14)),
                          child: SizedBox(
                            height: 110,
                            child: photo.toString().startsWith('http')
                                ? Image.network(photo, fit: BoxFit.cover)
                                : Image.asset(photo, fit: BoxFit.cover),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(10.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(name,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold)),
                                  ),
                                  if (verified)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.green.shade600,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Text('Verified',
                                          style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 12)),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(skills,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                      color: Colors.grey[700], fontSize: 12)),
                              const SizedBox(height: 6),
                              Text(exp.toString(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12)),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: () {
                                        // view profile — open candidate details
                                        showDialog<void>(
                                          context: context,
                                          builder: (ctx) => AlertDialog(
                                            title: Text(name),
                                            content: SingleChildScrollView(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                      'Phone: ${c['phone'] ?? '-'}'),
                                                  Text(
                                                      'Country: ${c['country'] ?? '-'}'),
                                                  const SizedBox(height: 8),
                                                  Text('Skills: $skills'),
                                                  const SizedBox(height: 8),
                                                  Text(
                                                      'Experience: ${exp ?? '-'}'),
                                                ],
                                              ),
                                            ),
                                            actions: [
                                              TextButton(
                                                  onPressed: () =>
                                                      Navigator.pop(ctx),
                                                  child: const Text('Close')),
                                            ],
                                          ),
                                        );
                                      },
                                      child: const Text('View'),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () {
                                        // quick verify / contact action
                                        if (!verified) {
                                          verifyUser(c['phone']);
                                        } else {
                                          ScaffoldMessenger.of(context)
                                              .showSnackBar(const SnackBar(
                                                  content: Text(
                                                      'Already verified')));
                                        }
                                      },
                                      child: Text(
                                          verified ? 'Verified' : 'Verify'),
                                    ),
                                  ),
                                ],
                              )
                            ],
                          ),
                        )
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
          ],
          // ======================
          // PENDING PAYMENTS
          // ======================
          if (pendingPayments.isNotEmpty) ...[
            const Padding(
              padding: EdgeInsets.fromLTRB(12, 12, 12, 4),
              child: Text(
                'Pending payment submissions',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
            ...pendingPayments.map((payment) {
              final paymentId = payment['_id']; // 🔥 FIX HERE

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                child: ListTile(
                  title: Text(payment['name'] ?? 'Candidate'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Phone: ${payment['phone'] ?? '-'}'),
                      Text(
                          'Amount: ${payment['amount'] ?? 0} ${payment['currency'] ?? 'KES'}'),
                      Text('Ref: ${payment['transactionCode'] ?? '-'}'),
                      Text('Method: ${payment['paymentMethod'] ?? '-'}'),
                    ],
                  ),
                  trailing: ElevatedButton(
                    onPressed: () {
                      print("🟡 BUTTON CLICKED");

                      if (paymentId == null || paymentId == "") {
                        print("❌ ERROR: paymentId is null");
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("❌ Invalid payment ID")),
                        );
                        return;
                      }

                      approvePayment(paymentId);
                    },
                    child: const Text('Approve'),
                  ),
                ),
              );
            }),
          ],

          const SizedBox(height: 10),

          // ======================
          // CANDIDATES
          // ======================
          const Padding(
            padding: EdgeInsets.fromLTRB(12, 0, 12, 4),
            child: Text(
              'Candidates',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),

          ...candidates.map((c) {
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: ListTile(
                contentPadding: const EdgeInsets.all(12),
                title: Text(
                  c['name'] ?? "No Name",
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("📞 ${c['phone'] ?? ''}"),
                    if (c['status'] != null) Text("📌 Status: ${c['status']}"),
                  ],
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.verified, color: Colors.green),
                      onPressed: () => verifyUser(c['phone']),
                    ),
                    PopupMenuButton<String>(
                      onSelected: (v) => updateStatus(c['phone'], v),
                      itemBuilder: (_) => const [
                        PopupMenuItem(
                            value: "available", child: Text("Available")),
                        PopupMenuItem(
                            value: "in_process", child: Text("In Process")),
                        PopupMenuItem(
                            value: "deployed", child: Text("Deployed")),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
