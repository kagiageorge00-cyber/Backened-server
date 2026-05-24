import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/app_config.dart';

class FlightOffer {
  final String id;
  final String source;
  final String instantTicketingRequired;
  final bool nonHomogeneous;
  final bool oneWay;
  final String lastTicketingDate;
  final int numberOfBookableSeats;
  final List<Map<String, dynamic>> itineraries;
  final Price price;
  final List<PricingOption> pricingOptions;
  final String validatingAirlineCodes;
  final String travelerPricings;

  FlightOffer({
    required this.id,
    required this.source,
    required this.instantTicketingRequired,
    required this.nonHomogeneous,
    required this.oneWay,
    required this.lastTicketingDate,
    required this.numberOfBookableSeats,
    required this.itineraries,
    required this.price,
    required this.pricingOptions,
    required this.validatingAirlineCodes,
    required this.travelerPricings,
  });

  factory FlightOffer.fromJson(Map<String, dynamic> json) {
    return FlightOffer(
      id: json['id'] ?? '',
      source: json['source'] ?? '',
      instantTicketingRequired: json['instantTicketingRequired'] ?? false,
      nonHomogeneous: json['nonHomogeneous'] ?? false,
      oneWay: json['oneWay'] ?? false,
      lastTicketingDate: json['lastTicketingDate'] ?? '',
      numberOfBookableSeats: json['numberOfBookableSeats'] ?? 0,
      itineraries: List<Map<String, dynamic>>.from(json['itineraries'] ?? []),
      price: Price.fromJson(json['price'] ?? {}),
      pricingOptions: List<PricingOption>.from(
          (json['pricingOptions'] ?? []).map((x) => PricingOption.fromJson(x))),
      validatingAirlineCodes: json['validatingAirlineCodes'] ?? '',
      travelerPricings: json['travelerPricings'] ?? '',
    );
  }

  String get totalPrice => price.total;
  String get currency => price.currency;
}

class Price {
  final String total;
  final String base;
  final String grandTotal;
  final String currency;

  Price({
    required this.total,
    required this.base,
    required this.grandTotal,
    required this.currency,
  });

  factory Price.fromJson(Map<String, dynamic> json) {
    return Price(
      total: json['total'] ?? '0',
      base: json['base'] ?? '0',
      grandTotal: json['grandTotal'] ?? '0',
      currency: json['currency'] ?? 'USD',
    );
  }
}

class PricingOption {
  final String id;
  final String fareDetailsBySegment;

  PricingOption({
    required this.id,
    required this.fareDetailsBySegment,
  });

  factory PricingOption.fromJson(Map<String, dynamic> json) {
    return PricingOption(
      id: json['id'] ?? '',
      fareDetailsBySegment: json['fareDetailsBySegment'] ?? '',
    );
  }
}

class Hotel {
  final String id;
  final String name;
  final String checkInDate;
  final String checkOutDate;
  final Price price;
  final String rating;
  final String roomType;
  final String description;

  Hotel({
    required this.id,
    required this.name,
    required this.checkInDate,
    required this.checkOutDate,
    required this.price,
    required this.rating,
    required this.roomType,
    required this.description,
  });

  factory Hotel.fromJson(Map<String, dynamic> json) {
    return Hotel(
      id: json['id'] ?? '',
      name: json['hotel']?['name'] ?? 'Unknown Hotel',
      checkInDate: json['offers']?[0]?['checkInDate'] ?? '',
      checkOutDate: json['offers']?[0]?['checkOutDate'] ?? '',
      price: Price.fromJson(json['offers']?[0]?['price'] ?? {}),
      rating: json['hotel']?['rating']?.toString() ?? 'N/A',
      roomType: json['offers']?[0]?['room']?['typeEstimated'] ?? 'Standard',
      description: json['hotel']?['description'] ?? 'No description available',
    );
  }
}

class City {
  final String iataCode;
  final String name;
  final String countryCode;

  City({
    required this.iataCode,
    required this.name,
    required this.countryCode,
  });

  factory City.fromJson(Map<String, dynamic> json) {
    return City(
      iataCode: json['iataCode'] ?? '',
      name: json['name'] ?? '',
      countryCode: json['address']?['countryCode'] ?? '',
    );
  }
}

class AmadeusService {
  static final String _baseUrl = AppConfig.amadeusApiBaseUrl;
  // Update YOUR_PROJECT_ID with your actual Firebase project ID

  static Future<List<FlightOffer>> searchFlights({
    required String origin,
    required String destination,
    required String departureDate,
    int adults = 1,
    int children = 0,
    int infants = 0,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/flightSearch'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'origin': origin,
              'destination': destination,
              'date': departureDate,
              'adults': adults,
              'children': children,
              'infants': infants,
            }),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['success'] == true) {
          final List<dynamic> data =
              jsonResponse['data'] ?? jsonResponse['flights'] ?? [];
          return data.map((flight) => FlightOffer.fromJson(flight)).toList();
        } else {
          throw Exception(jsonResponse['error'] ??
              jsonResponse['message'] ??
              'Flight search failed');
        }
      } else {
        throw Exception('Failed to search flights: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Flight search error: $e');
    }
  }

  static Future<List<Hotel>> searchHotels({
    required String city,
    required String checkInDate,
    required String checkOutDate,
    int adults = 1,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/hotelSearch'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'city': city,
              'checkInDate': checkInDate,
              'checkOutDate': checkOutDate,
              'adults': adults,
            }),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['success'] == true) {
          final List<dynamic> data =
              jsonResponse['data'] ?? jsonResponse['hotels'] ?? [];
          return data.map((hotel) => Hotel.fromJson(hotel)).toList();
        } else {
          throw Exception(jsonResponse['error'] ??
              jsonResponse['message'] ??
              'Hotel search failed');
        }
      } else {
        throw Exception('Failed to search hotels: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Hotel search error: $e');
    }
  }

  static Future<List<City>> searchCities({required String keyword}) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/citiesSearch'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'keyword': keyword}),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];
        return data.map((city) => City.fromJson(city)).toList();
      } else {
        throw Exception('Failed to search cities: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('City search error: $e');
    }
  }

  // Country to IATA code mapping for convenience
  static const Map<String, String> countryToIATA = {
    'United Arab Emirates': 'DXB',
    'Kenya': 'NBO',
    'Saudi Arabia': 'RYD',
    'United States': 'JFK',
    'Qatar': 'DOH',
    'Oman': 'MCT',
  };

  static String? getAirportCode(String country) => countryToIATA[country];
}
