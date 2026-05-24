// Minimal shim to satisfy generated dataconnect code during static analysis.
// This provides lightweight types and helpers; replace with the real
// `firebase_data_connect` package in production.

typedef Deserializer<T> = T Function(dynamic json);
typedef Serializer<T> = String Function(T value);

class ConnectorConfig {
  final List<dynamic> parts;
  final Map<String, dynamic> options;
  ConnectorConfig([dynamic a, dynamic b, dynamic c, this.options = const {}]) : parts = [a, b, c];
}

enum CallerSDKType { generated }

class FirebaseDataConnect {
  FirebaseDataConnect._();
  static FirebaseDataConnect instanceFor({ConnectorConfig? connectorConfig, CallerSDKType? sdkType}) => FirebaseDataConnect._();

  // Generic query/mutation placeholders
  QueryRef<D, V> query<D, V>(String name, Deserializer<D> d, Serializer<V> s, V? vars) => QueryRef<D, V>();
  MutationRef<D, V> mutation<D, V>(String name, Deserializer<D> d, Serializer<V> s, V vars) => MutationRef<D, V>();
}

class OperationResult<D, V> {
  final D? data;
  final dynamic error;
  OperationResult({this.data, this.error});
}

class QueryResult<D, V> extends OperationResult<D, V> {
  QueryResult({super.data, super.error});
}

class MutationRef<D, V> {
  Future<OperationResult<D, V>> execute() async => OperationResult<D, V>(data: null);
}

class QueryRef<D, V> {
  Future<QueryResult<D, V>> execute() async => QueryResult<D, V>(data: null);
}

Serializer<dynamic> get emptySerializer => (v) => '{}';

// Simple Timestamp shim
class Timestamp {
  final DateTime dateTime;
  Timestamp.fromDate(this.dateTime);
  Timestamp.now() : dateTime = DateTime.now();
  factory Timestamp.fromJson(dynamic json) {
    if (json == null) return Timestamp.now();
    if (json is int) return Timestamp.fromDate(DateTime.fromMillisecondsSinceEpoch(json));
    if (json is String) return Timestamp.fromDate(DateTime.parse(json));
    return Timestamp.now();
  }
  dynamic toJson() => dateTime.toIso8601String();
}

// Helpers used in generated code
T nativeFromJson<T>(dynamic v) {
  return v as T;
}

dynamic nativeToJson<T>(T v) {
  return v;
}
