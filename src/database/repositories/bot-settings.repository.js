const { getDb } = require('../firebase');

async function getBotSettings() {
  const db = await getDb();
  const snapshot = await db.collection('settings').doc('bot').get();
  return snapshot.exists ? snapshot.data() : {};
}

async function updateBotSettings(patch) {
  const db = await getDb();
  await db.collection('settings').doc('bot').set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
  return getBotSettings();
}

module.exports = { getBotSettings, updateBotSettings };
