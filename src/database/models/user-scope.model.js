/**
 * ALBEDO MULTI-TENANT USER SCOPE MODEL
 * Data user independen per grup (limit, exp, level, tier, ban per scope)
 */

const DEFAULT_LIMIT = 20;

function createScopedUser(data = {}) {
  const now = new Date().toISOString();
  return {
    userId: String(data.userId || '').trim(),
    scopeId: String(data.scopeId || 'dm').trim(),
    limit: typeof data.limit === 'number' ? data.limit : DEFAULT_LIMIT,
    maxLimit: Math.max(DEFAULT_LIMIT, data.maxLimit || data.limit || DEFAULT_LIMIT),
    exp: typeof data.exp === 'number' ? data.exp : 0,
    level: typeof data.level === 'number' ? data.level : 1,
    balance: typeof data.balance === 'number' ? data.balance : 0,
    tier: String(data.tier || 'free').toLowerCase(), // 'free' | 'premium' | 'vip'
    banned: !!data.banned,
    banReason: data.banReason || null,
    bannedCommands: Array.isArray(data.bannedCommands) ? data.bannedCommands : [],
    lastLimitReset: data.lastLimitReset || '',
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

module.exports = {
  DEFAULT_LIMIT,
  createScopedUser,
};
