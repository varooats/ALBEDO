/**
 * ALBEDO ROLE & PERMISSION SYSTEM
 * Hierarki role dan mapping akses command
 */

const ROLES = Object.freeze({
  SUPEROWNER: 'superowner',
  OWNER: 'owner',
  ADMIN: 'admin',           // Bot admin
  MODERATOR: 'moderator',   // Group admin / moderator
  GROUP_ADMIN: 'group_admin',
  VIP: 'vip',               // User tier VIP
  PREMIUM: 'premium',       // User tier Premium
  USER: 'user',             // User terdaftar biasa
  GUEST: 'guest',           // User publik / belum register
  BANNED: 'banned',         // Pengguna diblokir
});

const ROLE_RANKS = Object.freeze({
  [ROLES.SUPEROWNER]: 100,
  [ROLES.OWNER]: 90,
  [ROLES.ADMIN]: 70,
  [ROLES.MODERATOR]: 50,
  [ROLES.GROUP_ADMIN]: 50,
  [ROLES.VIP]: 40,
  [ROLES.PREMIUM]: 30,
  [ROLES.USER]: 20,
  [ROLES.GUEST]: 10,
  [ROLES.BANNED]: 0,
});

/**
 * Normalisasi role ke lowercase string
 */
function normalizeRole(role) {
  const r = String(role || '').toLowerCase().trim();
  if (r === 'superowner') return ROLES.SUPEROWNER;
  if (r === 'owner') return ROLES.OWNER;
  if (r === 'admin') return ROLES.ADMIN;
  if (r === 'moderator' || r === 'mod' || r === 'group_admin' || r === 'group-admin') return ROLES.GROUP_ADMIN;
  if (r === 'vip') return ROLES.VIP;
  if (r === 'premium' || r === 'prem') return ROLES.PREMIUM;
  if (r === 'user' || r === 'member') return ROLES.USER;
  if (r === 'banned' || r === 'ban') return ROLES.BANNED;
  if (r === 'guest' || r === 'public') return ROLES.GUEST;
  return ROLES.USER;
}

/**
 * Cek apakah role user memenuhi salah satu required roles atau memiliki rank yang cukup
 */
function hasRole(userRole, requiredRoles = []) {
  const normUser = normalizeRole(userRole);
  if (normUser === ROLES.SUPEROWNER || normUser === ROLES.OWNER) {
    return true; // Owner always full access
  }

  if (normUser === ROLES.BANNED) {
    return false;
  }

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const reqList = (Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]).map(normalizeRole);

  // Jika command bersifat publik/guest, semua non-banned boleh
  if (reqList.includes(ROLES.GUEST)) {
    return true;
  }

  // Cek kecocokan langsung
  if (reqList.includes(normUser)) {
    return true;
  }

  // Cek hierarki rank
  const userRank = ROLE_RANKS[normUser] || 0;
  for (const r of reqList) {
    const requiredRank = ROLE_RANKS[r] || 0;
    if (userRank >= requiredRank && requiredRank > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Resolusi role efektif pengirim pesan
 */
function resolveEffectiveRole({ isSuperOwner, isOwner, isBotAdmin, isGroupAdmin, tier = 'free', isRegistered = false }) {
  if (isSuperOwner) return ROLES.SUPEROWNER;
  if (isOwner) return ROLES.OWNER;
  if (isBotAdmin) return ROLES.ADMIN;
  if (isGroupAdmin) return ROLES.GROUP_ADMIN;

  const t = String(tier || '').toLowerCase().trim();
  if (t === 'vip') return ROLES.VIP;
  if (t === 'premium') return ROLES.PREMIUM;

  if (isRegistered) return ROLES.USER;
  return ROLES.GUEST;
}

module.exports = {
  ROLES,
  ROLE_RANKS,
  normalizeRole,
  hasRole,
  resolveEffectiveRole,
};
