const statuses = new Map();

function setAfk(jid, reason = '') {
  if (!jid) throw new Error('User JID required.');
  const status = { reason: String(reason).trim(), since: Date.now() };
  statuses.set(jid, status);
  return status;
}

function clearAfk(jid) {
  return statuses.delete(jid);
}

function getAfk(jid) {
  return statuses.get(jid) || null;
}

function formatAfkDuration(sinceMs) {
  const elapsed = Math.max(0, Date.now() - sinceMs);
  const totalSeconds = Math.floor(elapsed / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  if (minutes > 0) parts.push(`${minutes} menit`);
  if (parts.length === 0 || (days === 0 && hours === 0 && minutes === 0)) {
    parts.push(`${seconds} detik`);
  }
  return parts.join(' ');
}

module.exports = {
  setAfk,
  clearAfk,
  getAfk,
  formatAfkDuration,
};
