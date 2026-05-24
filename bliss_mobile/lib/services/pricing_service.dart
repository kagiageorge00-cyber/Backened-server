class PricingBreakdown {
  final double basePrice;
  final double markupAmount;
  final double markupPercentage;
  final double finalPrice;
  final String currency;

  PricingBreakdown({
    required this.basePrice,
    required this.markupAmount,
    required this.markupPercentage,
    required this.finalPrice,
    required this.currency,
  });

  double get profit => markupAmount;
}

class Insurance {
  final String id;
  final String name;
  final String description;
  final double price;
  final String type; // 'flight', 'hotel', 'universal'
  final String coverage;

  Insurance({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.type,
    required this.coverage,
  });
}

class Upsell {
  final String id;
  final String name;
  final String description;
  final double price;
  final String category; // 'seat', 'luggage', 'transfer', 'activity'
  final String? icon;

  Upsell({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    this.icon,
  });
}

class BookingTotal {
  final double basePrice;
  final double platformFee;
  final double insurancePrice;
  final double upsellsPrice;
  final double totalPrice;
  final String currency;
  final double profitMargin;

  BookingTotal({
    required this.basePrice,
    required this.platformFee,
    required this.insurancePrice,
    required this.upsellsPrice,
    required this.totalPrice,
    required this.currency,
    required this.profitMargin,
  });

  Map<String, dynamic> toMap() {
    return {
      'basePrice': basePrice,
      'platformFee': platformFee,
      'insurancePrice': insurancePrice,
      'upsellsPrice': upsellsPrice,
      'totalPrice': totalPrice,
      'currency': currency,
      'profitMargin': profitMargin,
    };
  }
}

class PricingService {
  // ==================== FLIGHT PRICING ====================
  static PricingBreakdown calculateFlightPrice(
    String basePrice,
    String currency,
  ) {
    final double base = double.tryParse(basePrice) ?? 0;
    
    // Fixed fee + percentage: $8 + 10%
    const double fixedFee = 8.0;
    const double markupPercentage = 0.10; // 10%

    final double percentageMarkup = base * markupPercentage;
    final double totalMarkup = percentageMarkup + fixedFee;
    final double finalPrice = base + totalMarkup;

    return PricingBreakdown(
      basePrice: base,
      markupAmount: totalMarkup,
      markupPercentage: markupPercentage * 100,
      finalPrice: finalPrice,
      currency: currency,
    );
  }

  // ==================== HOTEL PRICING ====================
  static PricingBreakdown calculateHotelPrice(
    String basePrice,
    String currency,
    int nights,
  ) {
    final double base = double.tryParse(basePrice) ?? 0;
    
    // 15% markup for hotels
    const double markupPercentage = 0.15;
    
    final double totalMarkup = base * markupPercentage;
    final double finalPrice = base + totalMarkup;

    return PricingBreakdown(
      basePrice: base,
      markupAmount: totalMarkup,
      markupPercentage: markupPercentage * 100,
      finalPrice: finalPrice,
      currency: currency,
    );
  }

  // ==================== INSURANCE OPTIONS ====================
  static List<Insurance> getFlightInsuranceOptions(double flightPrice) {
    return [
      Insurance(
        id: 'flight_basic',
        name: 'Basic Flight Protection',
        description: 'Covers cancellations and delays (4+ hours)',
        price: flightPrice * 0.05, // 5% of flight price
        type: 'flight',
        coverage: 'Cancellation, Delays, Lost Luggage',
      ),
      Insurance(
        id: 'flight_premium',
        name: 'Premium Flight Shield',
        description: 'Complete coverage including medical and emergency',
        price: flightPrice * 0.08, // 8% of flight price
        type: 'flight',
        coverage: 'All coverage + Medical up to \$50,000',
      ),
      Insurance(
        id: 'flight_platinum',
        name: 'Platinum Traveler Insurance',
        description: 'Ultimate protection for international travel',
        price: flightPrice * 0.12, // 12% of flight price
        type: 'flight',
        coverage: 'All coverage + Emergency evacuation + Trip delay',
      ),
    ];
  }

  static List<Insurance> getHotelInsuranceOptions(double hotelPrice) {
    return [
      Insurance(
        id: 'hotel_standard',
        name: 'Hotel Protection Plan',
        description: 'Covers booking cancellations',
        price: hotelPrice * 0.04, // 4% of hotel price
        type: 'hotel',
        coverage: 'Free cancellation up to 48 hours',
      ),
      Insurance(
        id: 'hotel_deluxe',
        name: 'Deluxe Stay Guard',
        description: 'Full coverage for your accommodation',
        price: hotelPrice * 0.07, // 7% of hotel price
        type: 'hotel',
        coverage: 'Free cancellation anytime + Room damage',
      ),
    ];
  }

  // ==================== UPSELL OPTIONS ====================
  static List<Upsell> getFlightUpsells() {
    return [
      Upsell(
        id: 'seat_upgrade_premium',
        name: 'Premium Seat Upgrade',
        description: 'Extra legroom & priority boarding',
        price: 45.0,
        category: 'seat',
        icon: '💺',
      ),
      Upsell(
        id: 'seat_upgrade_business',
        name: 'Business Class Upgrade',
        description: 'Full bed, gourmet meals, lounge access',
        price: 299.0,
        category: 'seat',
        icon: '✈️',
      ),
      Upsell(
        id: 'luggage_extra',
        name: 'Extra Luggage (23kg)',
        description: 'Additional checked baggage allowance',
        price: 35.0,
        category: 'luggage',
        icon: '🧳',
      ),
      Upsell(
        id: 'luggage_overweight',
        name: 'Overweight Bag (up to 32kg)',
        description: 'For oversized or heavy luggage',
        price: 60.0,
        category: 'luggage',
        icon: '📦',
      ),
      Upsell(
        id: 'transfer_airport',
        name: 'Airport Transfer',
        description: 'Door-to-door pickup & drop-off',
        price: 50.0,
        category: 'transfer',
        icon: '🚗',
      ),
      Upsell(
        id: 'transfer_vip',
        name: 'VIP Car Service',
        description: 'Premium vehicle with professional driver',
        price: 120.0,
        category: 'transfer',
        icon: '🚙',
      ),
    ];
  }

  static List<Upsell> getHotelUpsells() {
    return [
      Upsell(
        id: 'transfer_airport',
        name: 'Airport Transfer',
        description: 'Door-to-door pickup & drop-off',
        price: 50.0,
        category: 'transfer',
        icon: '🚗',
      ),
      Upsell(
        id: 'activity_city_tour',
        name: 'City Tour',
        description: 'Full day guided city tour with meals',
        price: 99.0,
        category: 'activity',
        icon: '🗺️',
      ),
      Upsell(
        id: 'activity_adventure',
        name: 'Adventure Activity',
        description: 'Extreme sports or outdoor adventure',
        price: 150.0,
        category: 'activity',
        icon: '🏔️',
      ),
      Upsell(
        id: 'activity_spa',
        name: 'Spa & Wellness Package',
        description: 'Relaxing spa treatments & wellness',
        price: 200.0,
        category: 'activity',
        icon: '🧖',
      ),
      Upsell(
        id: 'activity_dining',
        name: 'Fine Dining Package',
        description: 'Premium restaurant reservations included',
        price: 180.0,
        category: 'activity',
        icon: '🍽️',
      ),
    ];
  }

  // ==================== TOTAL CALCULATION ====================
  static BookingTotal calculateTotal({
    required double basePrice,
    required String currency,
    required List<Insurance> selectedInsurance,
    required List<Upsell> selectedUpsells,
    required bool isHotel,
  }) {
    // Calculate platform fee
    final platformFeeBd = isHotel
        ? calculateHotelPrice(basePrice.toString(), currency, 1)
        : calculateFlightPrice(basePrice.toString(), currency);

    final platformFee = platformFeeBd.markupAmount;

    // Calculate insurance total
    final double insuranceTotal =
        selectedInsurance.fold(0, (sum, ins) => sum + ins.price);

    // Calculate upsells total
    final double upsellsTotal =
        selectedUpsells.fold(0, (sum, up) => sum + up.price);

    // Total calculation
    final double totalPrice = basePrice + platformFee + insuranceTotal + upsellsTotal;
    final double profitMargin = platformFee +
        (insuranceTotal * 0.60) +
        (upsellsTotal * 0.40); // 60% on insurance, 40% on upsells

    return BookingTotal(
      basePrice: basePrice,
      platformFee: platformFee,
      insurancePrice: insuranceTotal,
      upsellsPrice: upsellsTotal,
      totalPrice: totalPrice,
      currency: currency,
      profitMargin: profitMargin,
    );
  }

  // ==================== PROFIT ANALYTICS ====================
  static Map<String, dynamic> getProfitAnalytics(BookingTotal total) {
    return {
      'platformCommission': total.platformFee,
      'insuranceProfit': total.insurancePrice * 0.60,
      'upsellsProfit': total.upsellsPrice * 0.40,
      'totalProfit': total.profitMargin,
      'profitMargin': '${(total.profitMargin / total.totalPrice * 100).toStringAsFixed(1)}%',
    };
  }
}
