const ADMIN_RANKS = new Set(['administrator', 'supervisor']);

function normalized(value) {
  return String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function permissionsFor(staff = {}) {
  const rank = normalized(staff.rank);
  const role = normalized(staff.role);
  const department = normalized(staff.department);
  if (ADMIN_RANKS.has(rank) || /^(admin|administrator|super admin|system administrator|operations lead|operations manager|supervisor)$/.test(role)) {
    return ['*'];
  }

  const permissions = ['chat.read', 'chat.reply', 'followup.manage'];
  if (rank === 'team lead') permissions.push('chat.assign');
  if (/customer care|support|recruitment|employer relations|visa|travel|operations/.test(department)) {
    permissions.push('chat.assign');
  }
  if (/marketplace|recruitment|operations/.test(department) || /job|marketplace/.test(role)) {
    permissions.push('jobs.manage', 'candidates.manage');
  }
  if (/marketing/.test(department) || /marketing/.test(role)) {
    permissions.push('campaigns.manage', 'social.manage', 'creative.manage');
  }
  return [...new Set(permissions)];
}

function requireStaffPermission(permission) {
  return (req, res, next) => {
    const permissions = permissionsFor(req.staff);
    if (permissions.includes('*') || permissions.includes(permission)) return next();
    return res.status(403).json({ success: false, error: `Your staff rank does not allow ${permission}` });
  };
}

module.exports = { permissionsFor, requireStaffPermission };
