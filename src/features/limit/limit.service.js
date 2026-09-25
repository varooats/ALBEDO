const { getUserByJid, saveUser } = require('../../database/repositories/user.repository');
const { getLevelForXp } = require('../games/xp.engine');

const DEFAULT_LIMIT = 20;

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calculateLimitPrice(currentLimit = DEFAULT_LIMIT, amount = 10) {
  const multiplier = 1 + Math.max(0, currentLimit - DEFAULT_LIMIT) / 50;
  return Math.round((amount / 10) * 500 * multiplier);
}

function applyDailyReset(user) {
  const today = getTodayString();
  if (user.lastLimitReset !== today) {
    user.lastLimitReset = today;
    // When reset occurs, user gets full capacity based on purchased quota (maxLimit)
    const capacity = Math.max(DEFAULT_LIMIT, user.maxLimit || user.limit || DEFAULT_LIMIT);
    user.maxLimit = capacity;
    user.limit = capacity;
    return true;
  }
  return false;
}

async function checkAndConsumeLimit(jid, cost = 1) {
  if (!jid) return { allowed: false, remaining: 0, unregistered: true };

  const user = await getUserByJid(jid);
  if (!user) {
    return {
      allowed: false,
      remaining: 0,
      unregistered: true,
    };
  }

  const resetApplied = applyDailyReset(user);
  if (resetApplied) {
    await saveUser(user);
  }

  const currentLimit = user.limit ?? DEFAULT_LIMIT;

  if (currentLimit < cost) {
    return {
      allowed: false,
      remaining: currentLimit,
      required: cost,
      user,
    };
  }

  user.limit = currentLimit - cost;
  user.updatedAt = new Date().toISOString();
  await saveUser(user);

  return {
    allowed: true,
    remaining: user.limit,
    consumed: cost,
    user,
  };
}

async function buyLimit(jid, amount = 10) {
  if (!jid) return { success: false, reason: 'invalid_jid' };

  const user = await getUserByJid(jid);
  if (!user) {
    return { success: false, reason: 'unregistered' };
  }

  applyDailyReset(user);

  const currentLimit = user.limit ?? DEFAULT_LIMIT;
  const currentMax = Math.max(DEFAULT_LIMIT, user.maxLimit || currentLimit);
  const price = calculateLimitPrice(currentLimit, amount);
  const currentExp = user.exp || 0;

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

  user.exp = currentExp - price;
  user.level = getLevelForXp(user.exp);
  // Increase current limit and expand daily permanent quota capacity
  user.limit = currentLimit + amount;
  user.maxLimit = currentMax + amount;
  user.updatedAt = new Date().toISOString();

  await saveUser(user);

  return {
    success: true,
    amount,
    price,
    remainingExp: user.exp,
    newLimit: user.limit,
    user,
  };
}

module.exports = {
  DEFAULT_LIMIT,
  getTodayString,
  calculateLimitPrice,
  checkAndConsumeLimit,
  buyLimit,
};
