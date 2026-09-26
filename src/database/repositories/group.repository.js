const { getDb } = require('../firebase');

const DEFAULT_SETTINGS = Object.freeze({
  antilink: 'off',
  links: [],
  antitoxic: false,
  badwords: [],
  welcome: true,
  left: true,
  detect: false,
  antidetect: false,
  autolevelup: true,
  messageCount: 0,
  messageCountByDay: {},
  messageCountByMonth: {},
});

async function getGroupSettings(jid) {
  if (!jid || !String(jid).endsWith('@g.us')) throw new Error('Valid group JID required.');
  const db = await getDb();
  const snapshot = await db.collection('groups').doc(jid).get();
  return { ...DEFAULT_SETTINGS, ...(snapshot.exists ? snapshot.data() : {}) };
}

async function updateGroupSettings(jid, patch) {
  if (!jid || !String(jid).endsWith('@g.us')) throw new Error('Valid group JID required.');
  const db = await getDb();
  await db.collection('groups').doc(jid).set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
  return getGroupSettings(jid);
}

module.exports = { DEFAULT_SETTINGS, getGroupSettings, updateGroupSettings };
