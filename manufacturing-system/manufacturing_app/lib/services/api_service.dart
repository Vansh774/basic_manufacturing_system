import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Change this to your backend IP when deploying
  static const String baseUrl = 'http://localhost:5000/api';
  
  // Get stored token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }
  
  // Get headers with authentication token
  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
  
  // ==================== AUTHENTICATION ====================
  
  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );
      
      print('Login response status: ${response.statusCode}');
      print('Login response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('token', data['token']);
          await prefs.setString('user', jsonEncode(data['user']));
        }
        return data;
      } else {
        throw Exception('Login failed: ${response.statusCode}');
      }
    } catch (e) {
      print('Login error: $e');
      rethrow;
    }
  }
  
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
  }
  
  static Future<Map<String, dynamic>> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    throw Exception('User not found');
  }
  
  // ==================== MACHINES ====================
  
  static Future<List<dynamic>> getMachines() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/machines'),
        headers: await _getHeaders(),
      );
      
      print('Get machines response: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['machines'];
      } else {
        throw Exception('Failed to load machines: ${response.statusCode}');
      }
    } catch (e) {
      print('Get machines error: $e');
      rethrow;
    }
  }
  
  static Future<Map<String, dynamic>> getMachineStats() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/machines/stats'),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['stats'];
      } else {
        throw Exception('Failed to load machine stats');
      }
    } catch (e) {
      print('Get machine stats error: $e');
      rethrow;
    }
  }
  
  static Future<Map<String, dynamic>> updateMachineStatus(
    int id, 
    String status, {
    String? reason,
  }) async {
    try {
      final body = {'status': status};
      if (reason != null) {
        body['reason'] = reason;
      }
      
      final response = await http.put(
        Uri.parse('$baseUrl/machines/$id/status'),
        headers: await _getHeaders(),
        body: jsonEncode(body),
      );
      
      print('Update status response: ${response.statusCode}');
      print('Update status body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to update status: ${response.statusCode}');
      }
    } catch (e) {
      print('Update status error: $e');
      rethrow;
    }
  }
  
  // ==================== PRODUCTION ====================
  
  static Future<Map<String, dynamic>> addProductionEntry({
    required int machineId,
    required String productId,
    required String shift,
    required int quantity,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/production'),
        headers: await _getHeaders(),
        body: jsonEncode({
          'machine_id': machineId,
          'product_id': productId,
          'shift': shift,
          'quantity': quantity,
        }),
      );
      
      print('Add production response: ${response.statusCode}');
      print('Add production body: ${response.body}');
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to add production entry: ${response.statusCode}');
      }
    } catch (e) {
      print('Add production error: $e');
      rethrow;
    }
  }
  
  static Future<int> getTodayProduction() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/production/today'),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['total'];
      } else {
        return 0;
      }
    } catch (e) {
      print('Get today production error: $e');
      return 0;
    }
  }
  
  static Future<List<dynamic>> getProductionByDate(String date) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/production/date/$date'),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['entries'];
      } else {
        return [];
      }
    } catch (e) {
      print('Get production by date error: $e');
      return [];
    }
  }
  
  // ==================== DOWNTIME ====================
  
  static Future<Map<String, dynamic>> reportDowntime({
    required int machineId,
    required String reason,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/downtime'),
        headers: await _getHeaders(),
        body: jsonEncode({
          'machine_id': machineId,
          'reason': reason,
        }),
      );
      
      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to report downtime');
      }
    } catch (e) {
      print('Report downtime error: $e');
      rethrow;
    }
  }
  
  static Future<List<dynamic>> getOpenDowntime() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/downtime/open'),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['downtimes'];
      } else {
        return [];
      }
    } catch (e) {
      print('Get open downtime error: $e');
      return [];
    }
  }
  
  static Future<Map<String, dynamic>> resolveDowntime(int id) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/downtime/$id/resolve'),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to resolve downtime');
      }
    } catch (e) {
      print('Resolve downtime error: $e');
      rethrow;
    }
  }
  
  // ==================== PROFIT & LOSS REPORTS ====================
  
  static Future<Map<String, dynamic>> getProfitLossSummary({
    required String periodType,
    required int year,
    int? month,
  }) async {
    try {
      String url = '$baseUrl/profit-loss/summary?periodType=$periodType&year=$year';
      if (month != null) {
        url += '&month=$month';
      }
      
      final response = await http.get(
        Uri.parse(url),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load profit/loss summary');
      }
    } catch (e) {
      print('Get profit/loss summary error: $e');
      rethrow;
    }
  }
  
  static Future<Map<String, dynamic>> getDailyReport(
    String startDate, 
    String endDate,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/profit-loss/daily?startDate=$startDate&endDate=$endDate'),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load daily report');
      }
    } catch (e) {
      print('Get daily report error: $e');
      rethrow;
    }
  }
  
  static Future<Map<String, dynamic>> getMonthlyReport(
    int year, 
    int month,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/profit-loss/monthly/$year/$month'),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load monthly report');
      }
    } catch (e) {
      print('Get monthly report error: $e');
      rethrow;
    }
  }
  
  static Future<Map<String, dynamic>> getYearlyReport(int year) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/profit-loss/yearly/$year'),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load yearly report');
      }
    } catch (e) {
      print('Get yearly report error: $e');
      rethrow;
    }
  }
  
  // ==================== USERS (for Owner only) ====================
  
  static Future<List<dynamic>> getAllUsers() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/users'),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['users'];
      } else {
        return [];
      }
    } catch (e) {
      print('Get all users error: $e');
      return [];
    }
  }
  
  static Future<Map<String, dynamic>> createUser({
    required String email,
    required String password,
    required String name,
    required String role,
    String? shift,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: await _getHeaders(),
        body: jsonEncode({
          'email': email,
          'password': password,
          'name': name,
          'role': role,
          'shift': shift,
        }),
      );
      
      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to create user');
      }
    } catch (e) {
      print('Create user error: $e');
      rethrow;
    }
  }
  
  // ==================== PRODUCTS ====================
  
  static Future<List<dynamic>> getProducts() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/products'),
        headers: await _getHeaders(),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['products'];
      } else {
        return [];
      }
    } catch (e) {
      print('Get products error: $e');
      return [];
    }
  }
}