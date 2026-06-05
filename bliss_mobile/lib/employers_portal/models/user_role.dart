enum UserRole {
  employer,
  candidate,
  agent,
  admin,
}

extension UserRoleExtension on UserRole {
  String get value {
    switch (this) {
      case UserRole.employer:
        return 'employer';
      case UserRole.candidate:
        return 'candidate';
      case UserRole.agent:
        return 'agent';
      case UserRole.admin:
        return 'admin';
    }
  }
}
