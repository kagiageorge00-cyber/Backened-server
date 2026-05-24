// lib/screens/holiday_packages_screen.dart 
import 'package:flutter/material.dart';
import 'package:bliss_mobile/services/amadeus_service.dart';
import 'package:bliss_mobile/services/pricing_service.dart';
import 'package:bliss_mobile/services/financial_reconciliation_service.dart';
import 'package:bliss_mobile/widgets/logo.dart';
import 'package:bliss_mobile/utils/payment_helper.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class HolidayPackagesScreen extends StatefulWidget {
  const HolidayPackagesScreen({super.key});

  @override
  State<HolidayPackagesScreen> createState() => _HolidayPackagesScreenState();
}

class _HolidayPackagesScreenState extends State<HolidayPackagesScreen> {
  List<Hotel> hotels = [];
  bool isLoading = false;
  String? selectedCity;
  DateTime? checkInDate;
  DateTime? checkOutDate;
  String? errorMessage;
  Hotel? selectedHotel;
  String? guestName;
  String? guestEmail;
  String? guestPhone;
  bool _submitting = false;

  // Insurance & Upsells
  List<Insurance> selectedInsurance = [];
  List<Upsell> selectedUpsells = [];
  List<Insurance> availableInsurance = [];
  List<Upsell> availableUpsells = [];
  BookingTotal? bookingTotal;

  final Map<String, String> cityMap = {
    'Dubai': 'DXB',
    'Nairobi': 'NBA',
    'Riyadh': 'RYD',
    'Doha': 'DOH',
    'Muscat': 'MCT',
  };

  final List<String> popularCities = ['Dubai', 'Nairobi', 'Riyadh', 'Doha', 'Muscat'];

  @override
  void initState() {
    super.initState();
    selectedCity = popularCities.first;
  }

  Future<void> pickDate({required bool isCheckIn}) async {
    final initial = DateTime.now().add(const Duration(days: 1));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked == null) return;
    setState(() {
      if (isCheckIn) {
        checkInDate = picked;
        if (checkOutDate != null && checkOutDate!.isBefore(picked)) {
          checkOutDate = picked.add(const Duration(days: 1));
        }
      } else {
        checkOutDate = picked;
      }
    });
  }

  Future<void> searchHotels() async {
    if (selectedCity == null || checkInDate == null || checkOutDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select city and dates')),
      );
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final cityCode = cityMap[selectedCity];
      if (cityCode == null) {
        throw Exception('City code not found for $selectedCity');
      }

      final dateFormat = DateFormat('yyyy-MM-dd');
      final checkIn = dateFormat.format(checkInDate!);
      final checkOut = dateFormat.format(checkOutDate!);

      final results = await AmadeusService.searchHotels(
        city: cityCode,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: 1,
      );

      setState(() {
        hotels = results;
      });

      if (results.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No hotels found for selected dates')),
        );
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error searching hotels: ${e.toString()}';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage!),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => isLoading = false);
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
            Text('Holiday Packages'),
          ],
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search form
              const Text(
                'Find Your Perfect Getaway',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              // City selection
              DropdownButtonFormField<String>(
                initialValue: selectedCity,
                decoration: const InputDecoration(
                  labelText: 'Select City',
                  border: OutlineInputBorder(),
                ),
                items: popularCities
                    .map((city) => DropdownMenuItem(value: city, child: Text(city)))
                    .toList(),
                onChanged: (value) => setState(() => selectedCity = value),
              ),
              const SizedBox(height: 16),

              // Check-in date
              Row(
                children: [
                  Expanded(
                    child: Text(
                      checkInDate == null
                          ? 'Check-in: not set'
                          : 'Check-in: ${dateFormat.format(checkInDate!)}',
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => pickDate(isCheckIn: true),
                    child: const Text('Pick'),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Check-out date
              Row(
                children: [
                  Expanded(
                    child: Text(
                      checkOutDate == null
                          ? 'Check-out: not set'
                          : 'Check-out: ${dateFormat.format(checkOutDate!)}',
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => pickDate(isCheckIn: false),
                    child: const Text('Pick'),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Search button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLoading ? null : searchHotels,
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text(
                            'Search Hotels',
                            style: TextStyle(fontSize: 16),
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Error message
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

              // Hotels list
              if (hotels.isNotEmpty)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${hotels.length} hotels found',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: hotels.length,
                      itemBuilder: (context, index) {
                        final hotel = hotels[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 4,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  hotel.name,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    if (hotel.rating != 'N/A')
                                      Row(
                                        children: [
                                          const Icon(Icons.star,
                                              color: Colors.amber, size: 18),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Rating: ${hotel.rating}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey,
                                            ),
                                          ),
                                        ],
                                      ),
                                    Text(
                                      'Room: ${hotel.roomType}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  hotel.description,
                                  style: const TextStyle(fontSize: 13),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${hotel.price.total} ${hotel.price.currency}',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.green,
                                      ),
                                    ),
                                    ElevatedButton(
                                      onPressed: () {
                                        _selectHotel(hotel);
                                      },
                                      child: const Text('Book Now'),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                )
              else if (!isLoading && hotels.isEmpty && checkInDate != null)
                Center(
                  child: Text(
                    'No hotels available for selected dates',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 14,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _selectHotel(Hotel hotel) {
    setState(() {
      selectedHotel = hotel;
      availableInsurance = PricingService.getHotelInsuranceOptions(
        double.parse(hotel.price.total),
      );
      availableUpsells = PricingService.getHotelUpsells();
      selectedInsurance = [];
      selectedUpsells = [];
    });

    _showHotelBookingModal(hotel);
  }

  void _showHotelBookingModal(Hotel hotel) {
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
                      'Enhance Your Stay',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Guest Details
                const Text(
                  '👤 Your Details',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (value) => guestName = value,
                ),
                const SizedBox(height: 10),
                TextFormField(
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (value) => guestEmail = value,
                ),
                const SizedBox(height: 10),
                TextFormField(
                  decoration: const InputDecoration(
                    labelText: 'Phone',
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (value) => guestPhone = value,
                ),
                const SizedBox(height: 20),

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
                  child: _buildHotelPricingSummary(hotel),
                ),
                const SizedBox(height: 16),

                // Confirm Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submitting
                        ? null
                        : () => _finalizeHotelBooking(hotel),
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

  Widget _buildHotelPricingSummary(Hotel hotel) {
    final basePrice = double.parse(hotel.price.total);
    final nights = checkOutDate!.difference(checkInDate!).inDays;
    
    bookingTotal = PricingService.calculateTotal(
      basePrice: basePrice,
      currency: hotel.price.currency,
      selectedInsurance: selectedInsurance,
      selectedUpsells: selectedUpsells,
      isHotel: true,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Hotel Base Price ($nights nights):'),
            Text(
              '${hotel.price.currency} ${basePrice.toStringAsFixed(2)}',
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
              '${hotel.price.currency} ${bookingTotal!.platformFee.toStringAsFixed(2)}',
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
                '${hotel.price.currency} ${bookingTotal!.insurancePrice.toStringAsFixed(2)}',
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
                '${hotel.price.currency} ${bookingTotal!.upsellsPrice.toStringAsFixed(2)}',
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
              '${hotel.price.currency} ${bookingTotal!.totalPrice.toStringAsFixed(2)}',
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

  Future<void> _finalizeHotelBooking(Hotel hotel) async {
    if (guestName == null || guestEmail == null || guestPhone == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all guest details')),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      if (bookingTotal == null) {
        throw Exception('Pricing calculation failed');
      }

      // Create the hotel booking
      final bookingRef = await FirebaseFirestore.instance
          .collection('hotel_bookings')
          .add({
        'guest_name': guestName,
        'guest_email': guestEmail,
        'guest_phone': guestPhone,
        'hotel_id': hotel.id,
        'hotel_name': hotel.name,
        'check_in': checkInDate,
        'check_out': checkOutDate,
        'nights': checkOutDate!.difference(checkInDate!).inDays,
        'hotel_base_price': bookingTotal!.basePrice,
        'platform_fee': bookingTotal!.platformFee,
        'insurance': selectedInsurance
            .map((i) => {'id': i.id, 'name': i.name, 'price': i.price})
            .toList(),
        'upsells': selectedUpsells
            .map((u) => {'id': u.id, 'name': u.name, 'price': u.price})
            .toList(),
        'pricing_breakdown': bookingTotal!.toMap(),
        'total_amount': bookingTotal!.totalPrice,
        'currency': hotel.price.currency,
        'profit_margin': bookingTotal!.profitMargin,
        'created_at': FieldValue.serverTimestamp(),
        'status': 'pending_payment',
      });

      // Create payment metadata for financial tracking
      await FinancialReconciliationService.recordPaymentMetadata(
        bookingId: bookingRef.id,
        bookingType: 'hotel',
        totalAmount: bookingTotal!.totalPrice,
        basePrice: bookingTotal!.basePrice,
        platformFee: bookingTotal!.platformFee,
        insurancePrice: bookingTotal!.insurancePrice,
        upsellsPrice: bookingTotal!.upsellsPrice,
        currency: hotel.price.currency,
      );

      // Process Payment
      bool paymentSuccessful = false;
      if (mounted) {
        paymentSuccessful = await PaymentHelper.showPaymentDialog(
          context: context,
          amount: bookingTotal!.totalPrice,
          description: 'Hotel Booking - ${hotel.name}',
          reference: 'HOTEL_${bookingRef.id}',
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
                'Hotel booking confirmed! Reference: ${bookingRef.id}',
              ),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 4),
            ),
          );

          setState(() {
            selectedHotel = null;
            guestName = null;
            guestEmail = null;
            guestPhone = null;
            selectedInsurance = [];
            selectedUpsells = [];
            bookingTotal = null;
            hotels = [];
            checkInDate = null;
            checkOutDate = null;
          });
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
}
