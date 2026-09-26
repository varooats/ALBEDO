const config = require('../../config/bot.config');
const { getBotSettings, updateBotSettings } = require('../../database/repositories/bot-settings.repository');

function normalizeNumber(value = '') {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/[^\d]/g, '');
}

async function getOwners() {
  const baseOwner = normalizeNumber(config.owner);
  try {
    const settings = await getBotSettings();
    const dynamicOwners = Array.isArray(settings?.owners) ? settings.owners.map(normalizeNumber) : [];
    const set = new Set([baseOwner, ...dynamicOwners].filter(Boolean));
    return Array.from(set);
  } catch {
    return baseOwner ? [baseOwner] : [];
  }
}

async function isOwner(numberOrJid) {
  const norm = normalizeNumber(numberOrJid);
  if (!norm) return false;
  const owners = await getOwners();
  return owners.includes(norm);
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
    throw new Error('Tidak dapat menghapus owner utama dari konfigurasi bot.');
  }
  const settings = await getBotSettings();
  const owners = Array.isArray(settings?.owners) ? settings.owners.map(normalizeNumber) : [];
  const filtered = owners.filter((o) => o !== norm);
  await updateBotSettings({ owners: filtered });
  return getOwners();
}

module.exports = {
  getOwners,
  isOwner,
  addOwner,
  delOwner,
};
