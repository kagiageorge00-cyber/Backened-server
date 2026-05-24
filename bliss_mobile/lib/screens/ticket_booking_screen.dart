// lib/screens/ticket_booking_screen.dart
import 'package:flutter/material.dart';
import 'package:bliss_mobile/services/amadeus_service.dart';
import 'package:bliss_mobile/services/pricing_service.dart';
import 'package:bliss_mobile/services/financial_reconciliation_service.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:bliss_mobile/utils/payment_helper.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class TicketBookingScreen extends StatefulWidget {
  const TicketBookingScreen({super.key});

  @override
  State<TicketBookingScreen> createState() => _TicketBookingScreenState();
}

class _TicketBookingScreenState extends State<TicketBookingScreen> {
  final _formKey = GlobalKey<FormState>();
  String? country;
  DateTime? departDate;
  DateTime? returnDate;
  bool isReturn = false;
  String name = '';
  String email = '';
  String phone = '';
  bool _submitting = false;
  List<FlightOffer> searchResults = [];
  bool showResults = false;
  String? errorMessage;
  FlightOffer? selectedFlight;
  
  // Insurance & Upsells
  List<Insurance> selectedInsurance = [];
  List<Upsell> selectedUpsells = [];
  List<Insurance> availableInsurance = [];
  List<Upsell> availableUpsells = [];
  BookingTotal? bookingTotal;

  final List<String> countries = [
    "United Arab Emirates",
    "Kenya",
    "Saudi Arabia",
    "United States",
    "Qatar",
    "Oman",
  ];

  // -------- ORIGIN AIRPORT (Default: NBO for Kenya) --------
  String get originCode => 'NBO'; // Default to Nairobi

  // -------- PICK DATE --------
  Future<void> pickDate({required bool isDepart}) async {
    final initial = DateTime.now().add(const Duration(days: 1));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked == null) return;
    setState(() {
      if (isDepart) {
        departDate = picked;
      } else {
        returnDate = picked;
      }
    });
  }

  // -------- SUBMIT AND SEARCH FLIGHTS --------
  Future<void> submitBooking() async {
    if (!_formKey.currentState!.validate()) return;
    if (country == null || departDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Choose destination and departure date")),
      );
      return;
    }

    _formKey.currentState!.save();
    setState(() {
      _submitting = true;
      errorMessage = null;
    });

    try {
      final destinationCode = AmadeusService.getAirportCode(country!);
      if (destinationCode == null) {
        throw Exception('Airport code not found for $country');
      }

      final dateFormat = DateFormat('yyyy-MM-dd');
      final departureDate = dateFormat.format(departDate!);

      // Search for real flights from Amadeus
      final flights = await AmadeusService.searchFlights(
        origin: originCode,
        destination: destinationCode,
        departureDate: departureDate,
        adults: 1,
      );

      if (flights.isEmpty) {
        throw Exception('No flights found for the selected route and date');
      }

      setState(() {
        searchResults = flights;
        showResults = true;
      });

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Found ${flights.length} flight(s)!'),
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (e) {
      setState(() {
        errorMessage = 'Error searching flights: ${e.toString()}';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage!),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _submitting = false);
    }
  }

  Future<void> confirmBooking(FlightOffer flight) async {
    setState(() {
      selectedFlight = flight;
      availableInsurance = PricingService.getFlightInsuranceOptions(
        double.parse(flight.totalPrice),
      );
      availableUpsells = PricingService.getFlightUpsells();
      selectedInsurance = [];
      selectedUpsells = [];
    });

    // Show insurance & upsells modal
    _showInsuranceAndUpsellsModal(flight);
  }

  void _showInsuranceAndUpsellsModal(FlightOffer flight) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.9,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Enhance Your Trip',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Insurance Section
                const Text(
                  '🛡️ Travel Insurance',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                ...availableInsurance.map((insurance) {
                  final isSelected =
                      selectedInsurance.any((i) => i.id == insurance.id);
                  return Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        children: [
                          Checkbox(
                            value: isSelected,
                            onChanged: (value) {
                              setState(() {
                                if (value ?? false) {
                                  selectedInsurance.add(insurance);
                                } else {
                                  selectedInsurance
                                      .removeWhere((i) => i.id == insurance.id);
                                }
                              });
                            },
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(insurance.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold)),
                                Text(insurance.description),
                                Text('Coverage: ${insurance.coverage}',
                                    style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                          ),
                          Text(
                            '\$${insurance.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 20),

                // Upsells Section
                const Text(
                  '⭐ Add-ons',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                ...availableUpsells.map((upsell) {
                  final isSelected =
                      selectedUpsells.any((u) => u.id == upsell.id);
                  return Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Row(
                        children: [
                          Checkbox(
                            value: isSelected,
                            onChanged: (value) {
                              setState(() {
                                if (value ?? false) {
                                  selectedUpsells.add(upsell);
                                } else {
                                  selectedUpsells
                                      .removeWhere((u) => u.id == upsell.id);
                                }
                              });
                            },
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${upsell.icon} ${upsell.name}',
                                    style: const TextStyle(fontWeight: FontWeight.bold)),
                                Text(upsell.description),
                              ],
                            ),
                          ),
                          Text(
                            '\$${upsell.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 24),

                // Pricing Summary
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: _buildPricingSummary(flight),
                ),
                const SizedBox(height: 16),

                // Confirm Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submitting
                        ? null
                        : () => _finalizeBooking(flight),
                    child: Padding(
                      padding: const EdgeInsets.all(14.0),
                      child: _submitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text(
                              'Confirm & Pay',
                              style: TextStyle(fontSize: 16),
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPricingSummary(FlightOffer flight) {
    final basePrice = double.parse(flight.totalPrice);
    bookingTotal = PricingService.calculateTotal(
      basePrice: basePrice,
      currency: flight.currency,
      selectedInsurance: selectedInsurance,
      selectedUpsells: selectedUpsells,
      isHotel: false,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Flight Base Price:'),
            Text(
              '${flight.currency} ${basePrice.toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Platform Fee & Service:'),
            Text(
              '${flight.currency} ${bookingTotal!.platformFee.toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.orange),
            ),
          ],
        ),
        if (selectedInsurance.isNotEmpty) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Insurance:'),
              Text(
                '${flight.currency} ${bookingTotal!.insurancePrice.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
              ),
            ],
          ),
        ],
        if (selectedUpsells.isNotEmpty) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Add-ons:'),
              Text(
                '${flight.currency} ${bookingTotal!.upsellsPrice.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
              ),
            ],
          ),
        ],
        const Divider(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'TOTAL AMOUNT:',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              '${flight.currency} ${bookingTotal!.totalPrice.toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _finalizeBooking(FlightOffer flight) async {
    setState(() => _submitting = true);

    try {
      if (bookingTotal == null) {
        throw Exception('Pricing calculation failed');
      }

      // Create the flight booking
      final bookingRef = await FirebaseFirestore.instance
          .collection('flight_bookings')
          .add({
        'name': name,
        'email': email,
        'phone': phone,
        'country': country,
        'depart_date': departDate,
        'return_date': returnDate,
        'is_return': isReturn,
        'flight_id': flight.id,
        'flight_base_price': bookingTotal!.basePrice,
        'platform_fee': bookingTotal!.platformFee,
        'insurance': selectedInsurance
            .map((i) => {'id': i.id, 'name': i.name, 'price': i.price})
            .toList(),
        'upsells': selectedUpsells
            .map((u) => {'id': u.id, 'name': u.name, 'price': u.price})
            .toList(),
        'pricing_breakdown': bookingTotal!.toMap(),
        'total_amount': bookingTotal!.totalPrice,
        'currency': flight.currency,
        'profit_margin': bookingTotal!.profitMargin,
        'created_at': FieldValue.serverTimestamp(),
        'status': 'pending_payment',
      });

      // Create payment metadata for financial tracking
      await FinancialReconciliationService.recordPaymentMetadata(
        bookingId: bookingRef.id,
        bookingType: 'flight',
        totalAmount: bookingTotal!.totalPrice,
        basePrice: bookingTotal!.basePrice,
        platformFee: bookingTotal!.platformFee,
        insurancePrice: bookingTotal!.insurancePrice,
        upsellsPrice: bookingTotal!.upsellsPrice,
        currency: flight.currency,
      );

      // Process Payment
      bool paymentSuccessful = false;
      if (mounted) {
        paymentSuccessful = await PaymentHelper.showPaymentDialog(
          context: context,
          amount: bookingTotal!.totalPrice,
          description: 'Flight Booking - ${flight.id}',
          reference: 'FLIGHT_${bookingRef.id}',
        ) ?? false;
      }

      if (paymentSuccessful) {
        // Update booking status to payment_verified
        await bookingRef.update({
          'status': 'payment_verified',
          'payment_date': FieldValue.serverTimestamp(),
        });

        if (mounted) {
          Navigator.pop(context); // Close modal
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Flight booking confirmed! Reference: ${bookingRef.id}',
              ),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 4),
            ),
          );

          setState(() {
            showResults = false;
            searchResults = [];
            selectedFlight = null;
            country = null;
            departDate = null;
            returnDate = null;
            isReturn = false;
            selectedInsurance = [];
            selectedUpsells = [];
            bookingTotal = null;
          });

          _formKey.currentState?.reset();
        }
      } else {
        // Payment failed - delete the booking
        await bookingRef.delete();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment cancelled. Booking not saved.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error processing booking: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.yMMMd();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Logo(height: 72, width: 72),
            SizedBox(width: 8),
            Text("Flight Booking"),
          ],
        ),
      ),
      body: showResults ? _buildFlightResults(dateFormat) : _buildSearchForm(dateFormat),
    );
  }

  Widget _buildFlightResults(DateFormat dateFormat) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              ElevatedButton.icon(
                onPressed: () => setState(() => showResults = false),
                icon: const Icon(Icons.arrow_back),
                label: const Text("Back to Search"),
              ),
              const Spacer(),
              Text('${searchResults.length} flights found',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: searchResults.length,
            itemBuilder: (context, index) {
              final flight = searchResults[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${flight.totalPrice} ${flight.currency}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                          Text(
                            'Seats: ${flight.numberOfBookableSeats}',
                            style: const TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Airline: ${flight.validatingAirlineCodes}',
                        style: const TextStyle(fontSize: 14),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Last ticketing: ${flight.lastTicketingDate}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          ElevatedButton(
                            onPressed: _submitting
                                ? null
                                : () => confirmBooking(flight),
                            child: _submitting
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  )
                                : const Text('Book this flight'),
                          ),
                          TextButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Full itinerary details would be shown here',
                                  ),
                                ),
                              );
                            },
                            child: const Text('View details'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSearchForm(DateFormat dateFormat) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            children: [
              if (errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.red.shade100,
                    border: Border.all(color: Colors.red),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              // -------- COUNTRY --------
              DropdownButtonFormField<String>(
                initialValue: country,
                decoration: const InputDecoration(
                  labelText: "Choose destination country",
                  border: OutlineInputBorder(),
                ),
                items: countries
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (v) => setState(() => country = v),
                validator: (v) => v == null ? "Select a country" : null,
              ),
              const SizedBox(height: 16),

              // -------- DEPART DATE --------
              Row(
                children: [
                  Expanded(
                    child: Text(
                      departDate == null
                          ? "Depart date: not set"
                          : "Depart: ${dateFormat.format(departDate!)}",
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => pickDate(isDepart: true),
                    child: const Text("Pick"),
                  )
                ],
              ),
              const SizedBox(height: 16),

              // -------- RETURN TICKET --------
              Row(
                children: [
                  Checkbox(
                    value: isReturn,
                    onChanged: (v) => setState(() => isReturn = v ?? false),
                  ),
                  const Text("Return ticket"),
                ],
              ),
              if (isReturn)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          returnDate == null
                              ? "Return date: not set"
                              : "Return: ${dateFormat.format(returnDate!)}",
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => pickDate(isDepart: false),
                        child: const Text("Pick"),
                      )
                    ],
                  ),
                ),
              const SizedBox(height: 20),

              // -------- PERSONAL DETAILS --------
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Your Details',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: "Full Name",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? "Enter your name" : null,
                onSaved: (v) => name = v!.trim(),
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: "Email",
                  border: OutlineInputBorder(),
                ),
                validator: (v) => (v == null || !v.contains("@"))
                    ? "Enter valid email"
                    : null,
                onSaved: (v) => email = v!.trim(),
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: "Phone",
                  border: OutlineInputBorder(),
                ),
                validator: (v) => (v == null || v.trim().length < 7)
                    ? "Enter phone"
                    : null,
                onSaved: (v) => phone = v!.trim(),
              ),
              const SizedBox(height: 24),

              // -------- SUBMIT --------
              _submitting
                  ? const CircularProgressIndicator()
                  : SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: submitBooking,
                        child: const Padding(
                          padding: EdgeInsets.all(12.0),
                          child: Text(
                            "Search Flights",
                            style: TextStyle(fontSize: 16),
                          ),
                        ),
                      ),
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
