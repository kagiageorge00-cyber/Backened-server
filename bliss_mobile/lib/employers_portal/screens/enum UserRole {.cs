enum UserRole {
  superAdmin,
  admin,
  employer,
  agent,
  staff,
  moderator,
  candidate;

  // ...fromString, extension, etc.
}

class PermissionService {
  static bool canAccessPage(UserRole role, String route) {
    // Map roles to allowed routes
    // Example:
    if (role == UserRole.superAdmin) return true;
    if (role == UserRole.employer && route.startsWith('/employer')) return true;
    // ...etc.
    return false;
  }

  static bool canPerformAction(UserRole role, String action) {
    // Map roles to allowed actions
    // Example:
    if (role == UserRole.moderator && action == 'banUser') return true;
    // ...etc.
    return false;
  }
}