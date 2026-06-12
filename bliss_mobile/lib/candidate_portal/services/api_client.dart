import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  final String baseUrl;
  String? authToken;

  ApiClient(this.baseUrl);

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Map<String, String> _headers([Map<String, String>? headers]) {
    final out = <String, String>{
      'Content-Type': 'application/json',
      if (authToken != null && authToken!.isNotEmpty)
        'Authorization': 'Bearer $authToken',
    };
    if (headers != null) {
      out.addAll(headers);
    }
    return out;
  }

  Map<String, String> get authHeaders => _headers();

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body,
      [Map<String, String>? headers]) async {
    final res = await http.post(_uri(path),
        body: json.encode(body), headers: _headers(headers));
    return json.decode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> get(String path,
      [Map<String, String>? headers]) async {
    final res = await http.get(_uri(path), headers: _headers(headers));
    return json.decode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> put(String path, Map<String, dynamic> body,
      [Map<String, String>? headers]) async {
    final res = await http.put(_uri(path),
        body: json.encode(body), headers: _headers(headers));
    return json.decode(res.body) as Map<String, dynamic>;
  }

  void setAuthToken(String token) {
    authToken = token;
  }
}
