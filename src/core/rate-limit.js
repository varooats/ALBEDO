// Anti abuse / rate limit: User (10/10s), Group (50/10s), Global (1000/60s)
const userRequests = new Map();
const groupRequests = new Map();
let globalRequests = [];

const USER_LIMIT = 10;
const USER_WINDOW_MS = 10 * 1000;

const GROUP_LIMIT = 50;
const GROUP_WINDOW_MS = 10 * 1000;

const GLOBAL_LIMIT = 1000;
const GLOBAL_WINDOW_MS = 60 * 1000;

function prune(timestamps, windowMs, now) {
  const cutoff = now - windowMs;
  let idx = 0;
  while (idx < timestamps.length && timestamps[idx] <= cutoff) {
    idx++;
  }
  if (idx > 0) timestamps.splice(0, idx);
}

function checkRateLimit({ senderJid, groupJid, isOwner = false }) {
  if (isOwner) return { allowed: true };

  const now = Date.now();

  // 1. Global limit
  prune(globalRequests, GLOBAL_WINDOW_MS, now);
  if (globalRequests.length >= GLOBAL_LIMIT) {
    return { allowed: false, reason: 'global', retryAfter: Math.ceil((globalRequests[0] + GLOBAL_WINDOW_MS - now) / 1000) };
  }

  // 2. Group limit
  if (groupJid && groupJid.endsWith('@g.us')) {
    let groupHistory = groupRequests.get(groupJid);
    if (!groupHistory) {
      groupHistory = [];
      groupRequests.set(groupJid, groupHistory);
    }
    prune(groupHistory, GROUP_WINDOW_MS, now);
    if (groupHistory.length >= GROUP_LIMIT) {
      return { allowed: false, reason: 'group', retryAfter: Math.ceil((groupHistory[0] + GROUP_WINDOW_MS - now) / 1000) };
    }
  }

  // 3. User limit
  if (senderJid) {
    let userHistory = userRequests.get(senderJid);
    if (!userHistory) {
      userHistory = [];
      userRequests.set(senderJid, userHistory);
    }
    prune(userHistory, USER_WINDOW_MS, now);
    if (userHistory.length >= USER_LIMIT) {
      return { allowed: false, reason: 'user', retryAfter: Math.ceil((userHistory[0] + USER_WINDOW_MS - now) / 1000) };
    }
  }

  // Record hit
  globalRequests.push(now);
  if (groupJid && groupJid.endsWith('@g.us')) {
    groupRequests.get(groupJid).push(now);
  }
  if (senderJid) {
    userRequests.get(senderJid).push(now);
  }

  return { allowed: true };
}

function resetRateLimits() {
  userRequests.clear();
  groupRequests.clear();
  globalRequests = [];
}

const RATE_LIMIT_MESSAGE = [
  '⚠️ *TOO MANY REQUESTS*',
  '',
  'Tunggu beberapa detik sebelum',
  'menggunakan command lagi.',
].join('\n');

module.exports = {
  checkRateLimit,
  resetRateLimits,
  RATE_LIMIT_MESSAGE,
  USER_LIMIT,
  GROUP_LIMIT,
  GLOBAL_LIMIT,
};
