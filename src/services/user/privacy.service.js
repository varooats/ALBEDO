const { getUserByJid, saveUser } = require('../../database/repositories/user.repository');

const DEFAULT_PRIVACY = Object.freeze({
  profile: 'public', // 'public' | 'private'
  stats: 'public',   // 'public' | 'private'
  history: 'private', // 'public' | 'private'
});

async function getUserPrivacy(jid) {
  const user = await getUserByJid(jid);
  return {
    ...DEFAULT_PRIVACY,
    ...(user?.privacy || {}),
  };
}

async function setUserPrivacy(jid, key, value) {
  const cleanKey = String(key || '').toLowerCase().trim();
  const cleanVal = String(value || '').toLowerCase().trim();

  if (!['profile', 'stats', 'history'].includes(cleanKey)) {
    throw new Error('Field privacy harus: profile, stats, atau history.');
  }

  if (!['public', 'private'].includes(cleanVal)) {
    throw new Error('Nilai privacy harus "public" atau "private".');
  }

  const user = await getUserByJid(jid);
  if (!user) throw new Error('User belum terdaftar. Ketik .register terlebih dahulu.');

  user.privacy = {
    ...DEFAULT_PRIVACY,
    ...(user.privacy || {}),
    [cleanKey]: cleanVal,
  };
  user.updatedAt = new Date().toISOString();

  await saveUser(user);
  return user.privacy;
}

function formatPrivacyCard(privacy) {
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Public');
  return [
    '╭─〔 🔐 PRIVACY 〕',
    '│',
    `│ Profile visibility : ${cap(privacy.profile)}`,
    `│ Game statistics    : ${cap(privacy.stats)}`,
    `│ Activity history   : ${cap(privacy.history)}`,
    '│',
    '╰──────────────────',
    '> Ubah dengan: `.privacy <field> <public|private>`',
    '> Contoh: `.privacy profile private`',
  ].join('\n');
}

module.exports = {
  DEFAULT_PRIVACY,
  getUserPrivacy,
  setUserPrivacy,
  formatPrivacyCard,
};
