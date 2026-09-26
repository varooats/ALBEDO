const { getDb } = require('../firebase');

const DEFAULT_SETTINGS = Object.freeze({
  status: 'pending', // 'active' | 'pending' | 'blocked' | 'suspended'
  name: '',
  approvedBy: null,
  approvedAt: null,
  invitedAt: null,
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

async function getGroup(jid) {
  if (!jid || !String(jid).endsWith('@g.us')) return null;
  const db = await getDb();
  const snapshot = await db.collection('groups').doc(jid).get();
  if (!snapshot.exists) return null;
  return { ...DEFAULT_SETTINGS, ...snapshot.data(), jid };
}

async function getGroupSettings(jid) {
  if (!jid || !String(jid).endsWith('@g.us')) throw new Error('Valid group JID required.');
  const db = await getDb();
  const snapshot = await db.collection('groups').doc(jid).get();
  return { ...DEFAULT_SETTINGS, ...(snapshot.exists ? snapshot.data() : {}), jid };
}

async function updateGroupSettings(jid, patch) {
  if (!jid || !String(jid).endsWith('@g.us')) throw new Error('Valid group JID required.');
  const db = await getDb();
  await db.collection('groups').doc(jid).set({ ...patch, jid, updatedAt: new Date().toISOString() }, { merge: true });
  return getGroupSettings(jid);
}

async function approveGroup(jid, name = '', approvedBy = 'owner') {
  return updateGroupSettings(jid, {
    status: 'active',
    name: name || undefined,
    approvedBy,
    approvedAt: Date.now(),
  });
}

async function setGroupStatus(jid, status) {
  const valid = ['active', 'pending', 'blocked', 'suspended'];
  if (!valid.includes(status)) throw new Error(`Invalid status: ${status}`);
  return updateGroupSettings(jid, { status });
}

async function listApprovedGroups() {
  const db = await getDb();
  const snapshot = await db.collection('groups').where('status', '==', 'active').get();
  return snapshot.docs.map((doc) => ({ ...DEFAULT_SETTINGS, ...doc.data(), jid: doc.id }));
}

module.exports = {
  DEFAULT_SETTINGS,
  getGroup,
  getGroupSettings,
  updateGroupSettings,
  approveGroup,
  setGroupStatus,
  listApprovedGroups,
};
