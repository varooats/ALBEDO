const config = require('../../config/bot.config');
const { getBotSettings, updateBotSettings } = require('../../database/repositories/bot-settings.repository');

const ROLE_RANKS = Object.freeze({
  SUPEROWNER: 4,
  OWNER: 3,
  ADMIN: 2,
  GROUP_ADMIN: 1,
  USER: 0,
});

function normalizeNumber(value = '') {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/[^\d]/g, '');
}

async function getSuperOwners() {
  const base = normalizeNumber(config.owner);
  try {
    const settings = await getBotSettings();
    const dynamic = Array.isArray(settings?.superowners) ? settings.superowners.map(normalizeNumber) : [];
    return Array.from(new Set([base, ...dynamic].filter(Boolean)));
  } catch {
    return base ? [base] : [];
  }
}

async function getOwners() {
  const superOwners = await getSuperOwners();
  try {
    const settings = await getBotSettings();
    const dynamic = Array.isArray(settings?.owners) ? settings.owners.map(normalizeNumber) : [];
    return Array.from(new Set([...superOwners, ...dynamic].filter(Boolean)));
  } catch {
    return superOwners;
  }
}

async function getBotAdmins() {
  try {
    const settings = await getBotSettings();
    const admins = Array.isArray(settings?.admins) ? settings.admins.map(normalizeNumber) : [];
    return Array.from(new Set(admins.filter(Boolean)));
  } catch {
    return [];
  }
}

async function getUserRole(numberOrJid) {
  const norm = normalizeNumber(numberOrJid);
  if (!norm) return 'USER';

  const superOwners = await getSuperOwners();
  if (superOwners.includes(norm)) return 'SUPEROWNER';

  const owners = await getOwners();
  if (owners.includes(norm)) return 'OWNER';

  const admins = await getBotAdmins();
  if (admins.includes(norm)) return 'ADMIN';

  return 'USER';
}

async function isSuperOwner(numberOrJid) {
  const norm = normalizeNumber(numberOrJid);
  if (!norm) return false;
  const superOwners = await getSuperOwners();
  return superOwners.includes(norm);
}

async function isOwner(numberOrJid) {
  const norm = normalizeNumber(numberOrJid);
  if (!norm) return false;
  const owners = await getOwners();
  return owners.includes(norm);
}

async function isBotAdmin(numberOrJid) {
  const norm = normalizeNumber(numberOrJid);
  if (!norm) return false;
  const role = await getUserRole(norm);
  return ROLE_RANKS[role] >= ROLE_RANKS.ADMIN;
}

async function addOwner(number) {
  const norm = normalizeNumber(number);
  if (!norm) throw new Error('Nomor tidak valid.');
  const settings = await getBotSettings();
  const owners = Array.isArray(settings?.owners) ? [...settings.owners] : [];
  if (!owners.includes(norm)) {
    owners.push(norm);
    await updateBotSettings({ owners });
  }
  return getOwners();
}

async function delOwner(number) {
  const norm = normalizeNumber(number);
  const baseOwner = normalizeNumber(config.owner);
  if (norm === baseOwner) {
    throw new Error('Tidak dapat menghapus superowner utama.');
  }
  const settings = await getBotSettings();
  const owners = Array.isArray(settings?.owners) ? settings.owners.map(normalizeNumber) : [];
  const filtered = owners.filter((o) => o !== norm);
  await updateBotSettings({ owners: filtered });
  return getOwners();
}

async function addBotAdmin(number) {
  const norm = normalizeNumber(number);
  if (!norm) throw new Error('Nomor tidak valid.');
  const settings = await getBotSettings();
  const admins = Array.isArray(settings?.admins) ? [...settings.admins] : [];
  if (!admins.includes(norm)) {
    admins.push(norm);
    await updateBotSettings({ admins });
  }
  return getBotAdmins();
}

async function delBotAdmin(number) {
  const norm = normalizeNumber(number);
  const settings = await getBotSettings();
  const admins = Array.isArray(settings?.admins) ? settings.admins.map(normalizeNumber) : [];
  const filtered = admins.filter((a) => a !== norm);
  await updateBotSettings({ admins: filtered });
  return getBotAdmins();
}

module.exports = {
  ROLE_RANKS,
  normalizeNumber,
  getSuperOwners,
  getOwners,
  getBotAdmins,
  getUserRole,
  isSuperOwner,
  isOwner,
  isBotAdmin,
  addOwner,
  delOwner,
  addBotAdmin,
  delBotAdmin,
};
