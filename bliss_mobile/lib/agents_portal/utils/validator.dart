class Validator {
  static String? requiredField(String? value) {
    return value == null || value.isEmpty ? 'This field is required' : null;
  }

  static String? email(String? value) {
    if (value == null || value.isEmpty) return 'Email is required';
    if (!value.contains('@')) return 'Enter valid email';
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.isEmpty) return 'Phone is required';
    if (value.length < 8) return 'Enter valid phone number';
    return null;
  }
}
