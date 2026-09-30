/**
 * ALBEDO COOLDOWN MANAGER
 * Mengatur jeda per-command untuk mencegah spam eksekusi berulang
 */

// key: `${userId}:${scopeId}:${commandName}` -> expireTimestamp (ms)
const cooldownMap = new Map();

function getCooldownKey(userId = '', scopeId = '', commandName = '') {
  return `${String(userId).trim()}:${String(scopeId).trim()}:${String(commandName).toLowerCase().trim()}`;
}

function pruneExpired(now) {
  for (const [key, expireAt] of cooldownMap.entries()) {
    if (now >= expireAt) {
      cooldownMap.delete(key);
    }
  }
}

/**
 * Cek dan pasang cooldown untuk pengguna pada command tertentu
 * @param {string} userId - JID pengguna
 * @param {string} scopeId - JID grup atau 'dm'
 * @param {string} commandName - Nama canonical command
 * @param {number} cooldownSec - Durasi cooldown dalam detik
 * @param {boolean} isBypass - Apakah user bypass cooldown (Owner / VIP)
 * @returns {{ allowed: boolean, remainingSec?: number }}
 */
function checkCooldown(userId, scopeId, commandName, cooldownSec = 0, isBypass = false) {
  if (isBypass || !cooldownSec || cooldownSec <= 0) {
    return { allowed: true, remainingSec: 0 };
  }

  const now = Date.now();
  if (cooldownMap.size > 2000) {
    pruneExpired(now);
  }

  const key = getCooldownKey(userId, scopeId, commandName);
  const activeExpire = cooldownMap.get(key);

  if (activeExpire && now < activeExpire) {
    const remainingMs = activeExpire - now;
    return {
      allowed: false,
      remainingSec: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }

  // Pasang cooldown baru
  cooldownMap.set(key, now + (cooldownSec * 1000));
  return { allowed: true, remainingSec: 0 };
}

function resetCooldown(userId, scopeId, commandName) {
  const key = getCooldownKey(userId, scopeId, commandName);
  cooldownMap.delete(key);
}

function clearAllCooldowns() {
  cooldownMap.clear();
}

module.exports = {
  checkCooldown,
  resetCooldown,
  clearAllCooldowns,
};
