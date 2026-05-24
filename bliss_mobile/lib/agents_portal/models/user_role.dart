enum UserRole {
  admin, // Finance/system admin - access to financial dashboard
  employer, // Company hiring - post jobs, manage applicants
  agent, // Recruitment agent - manage candidates
  candidate, // Job seeker - apply for jobs
  staff, // Internal staff - manage operations
  ;

  static UserRole fromString(String value) {
    return UserRole.values.firstWhere(
      (role) => role.toString().split('.').last == value,
      orElse: () => UserRole.candidate, // default role
    );
  }
}

extension UserRoleExtension on UserRole {
  String get value {
    return toString().split('.').last;
  }

  bool get isAdmin => this == UserRole.admin;
  bool get isEmployer => this == UserRole.employer;
  bool get isAgent => this == UserRole.agent;
  bool get isCandidate => this == UserRole.candidate;
  bool get isStaff => this == UserRole.staff;
}
