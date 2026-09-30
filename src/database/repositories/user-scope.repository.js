/**
 * ALBEDO SCOPED USER REPOSITORY
 * Penyimpanan dan manipulasi data user multi-tenant per scope (grup / DM)
 */

const { getDb } = require('../firebase');
const { createScopedUser, DEFAULT_LIMIT } = require('../models/user-scope.model');
const { calculateLimitPrice } = require('../../services/limit/limit.service');
const { getLevelForXp } = require('../../features/games/xp.engine');

// In-memory cache: `${userId}_${scopeId}` -> scopedUser
const scopeCache = new Map();

function getDocId(userId, scopeId) {
  const u = String(userId || '').replace(/[^a-zA-Z0-9]/g, '_');
  const s = String(scopeId || 'dm').replace(/[^a-zA-Z0-9]/g, '_');
  return `${u}__${s}`;
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function applyScopedDailyReset(scoped) {
  const today = getTodayString();
  if (scoped.lastLimitReset !== today) {
    scoped.lastLimitReset = today;
    const capacity = Math.max(DEFAULT_LIMIT, scoped.maxLimit || DEFAULT_LIMIT);
    scoped.maxLimit = capacity;
    scoped.limit = capacity;
    return true;
  }
  return false;
}

async function getScopedUser(userId, scopeId = 'dm') {
  if (!userId) return null;
  const docId = getDocId(userId, scopeId);

  if (scopeCache.has(docId)) {
    const cached = scopeCache.get(docId);
    if (applyScopedDailyReset(cached)) {
      saveScopedUser(cached).catch(() => {});
    }
    return cached;
  }

  let data = null;
  try {
    const db = await getDb();
    const doc = await db.collection('user_scopes').doc(docId).get();
    if (doc.exists) {
      data = doc.data();
    }
  } catch (err) {
    // Fallback in-memory
  }

  const scoped = createScopedUser({
    ...(data || {}),
    userId,
    scopeId,
  });

  applyScopedDailyReset(scoped);
  scopeCache.set(docId, scoped);
  return scoped;
}

async function saveScopedUser(scopedUser) {
  if (!scopedUser?.userId) return;
  const docId = getDocId(scopedUser.userId, scopedUser.scopeId);
  scopedUser.updatedAt = new Date().toISOString();
  scopeCache.set(docId, scopedUser);

  try {
    const db = await getDb();
    await db.collection('user_scopes').doc(docId).set(scopedUser, { merge: true });
  } catch (err) {
    // Fallback cached
  }
}

async function checkAndConsumeScopedLimit(userId, scopeId, cost = 1, isOwner = false) {
  if (isOwner) {
    return { allowed: true, remaining: 9999, isOwner: true };
  }

  const scoped = await getScopedUser(userId, scopeId);
  if (!scoped) {
    return { allowed: false, remaining: 0, unregistered: true };
  }

  if (scoped.tier === 'vip') {
    return { allowed: true, remaining: 9999, isVip: true, scoped };
  }

  const currentLimit = scoped.limit ?? DEFAULT_LIMIT;
  if (currentLimit < cost) {
    return {
      allowed: false,
      remaining: currentLimit,
      required: cost,
      scoped,
    };
  }

  scoped.limit = currentLimit - cost;
  await saveScopedUser(scoped);

  return {
    allowed: true,
    remaining: scoped.limit,
    consumed: cost,
    scoped,
  };
}

async function buyScopedLimit(userId, scopeId, amount = 10) {
  const scoped = await getScopedUser(userId, scopeId);
  if (!scoped) return { success: false, reason: 'user_not_found' };

  applyScopedDailyReset(scoped);

  const currentLimit = scoped.limit ?? DEFAULT_LIMIT;
  const currentMax = Math.max(DEFAULT_LIMIT, scoped.maxLimit || currentLimit);
  const price = calculateLimitPrice(currentLimit, amount);
  const currentExp = scoped.exp || 0;

  if (currentExp < price) {
    return {
      success: false,
      reason: 'insufficient_exp',
      price,
      currentExp,
      currentLimit,
      missingExp: price - currentExp,
    };
  }

  scoped.exp = currentExp - price;
  scoped.level = getLevelForXp(scoped.exp);
  scoped.limit = currentLimit + amount;
  scoped.maxLimit = currentMax + amount;
  await saveScopedUser(scoped);

  return {
    success: true,
    amount,
    price,
    remainingExp: scoped.exp,
    newLimit: scoped.limit,
    scoped,
  };
}

async function setScopedBan(userId, scopeId, banned = true, reason = '') {
  const scoped = await getScopedUser(userId, scopeId);
  if (!scoped) return null;
  scoped.banned = !!banned;
  scoped.banReason = banned ? (reason || 'Diban dari grup ini') : null;
  await saveScopedUser(scoped);
  return scoped;
}

async function setScopedCommandBan(userId, scopeId, commandName, banned = true) {
  const scoped = await getScopedUser(userId, scopeId);
  if (!scoped) return null;
  const cmd = String(commandName).toLowerCase().trim();
  const list = new Set(scoped.bannedCommands || []);
  if (banned) {
    list.add(cmd);
  } else {
    list.delete(cmd);
  }
  scoped.bannedCommands = Array.from(list);
  await saveScopedUser(scoped);
  return scoped;
}

module.exports = {
  getScopedUser,
  saveScopedUser,
  checkAndConsumeScopedLimit,
  buyScopedLimit,
  setScopedBan,
  setScopedCommandBan,
};
