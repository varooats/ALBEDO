const { getDb } = require('../../database/firebase');

// In-memory blacklist cache: jid -> { jid, reason, bannedAt, bannedBy }
const blacklistCache = new Map();
let loaded = false;

function normalizeJid(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const clean = raw.replace(/[^\d]/g, '');
  return clean ? `${clean}@s.whatsapp.net` : '';
}

async function loadBlacklist() {
  if (loaded) return;
  try {
    const db = await getDb();
    const doc = await db.collection('settings').doc('blacklist').get();
    if (doc.exists) {
      const data = doc.data()?.list || [];
      for (const item of data) {
        if (item?.jid) blacklistCache.set(item.jid, item);
      }
    }
  } catch (err) {
    // ponytail: fallback in-memory only if database down
  } finally {
    loaded = true;
  }
}

async function syncToDb() {
  try {
    const db = await getDb();
    const list = Array.from(blacklistCache.values());
    await db.collection('settings').doc('blacklist').set({
      list,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    // ponytail: firestore write failure logged silently
  }
}

async function banUser(target, reason = 'No reason provided', bannedBy = 'system') {
  await loadBlacklist();
  const jid = normalizeJid(target);
  if (!jid) throw new Error('JID / nomor pengguna tidak valid.');

  const entry = {
    jid,
    reason: String(reason || 'Melanggar aturan').trim(),
    bannedAt: Date.now(),
    bannedBy: String(bannedBy || 'owner'),
  };
  blacklistCache.set(jid, entry);
  await syncToDb();
  return entry;
}

async function unbanUser(target) {
  await loadBlacklist();
  const jid = normalizeJid(target);
  if (!jid) throw new Error('JID / nomor pengguna tidak valid.');
  const removed = blacklistCache.delete(jid);
  if (removed) await syncToDb();
  return removed;
}

async function isBanned(target) {
  await loadBlacklist();
  const jid = normalizeJid(target);
  return blacklistCache.has(jid);
}

async function getBanInfo(target) {
  await loadBlacklist();
  const jid = normalizeJid(target);
  return blacklistCache.get(jid) || null;
}

async function listBannedUsers() {
  await loadBlacklist();
  return Array.from(blacklistCache.values());
}

module.exports = {
  normalizeJid,
  banUser,
  unbanUser,
  isBanned,
  getBanInfo,
  listBannedUsers,
};
