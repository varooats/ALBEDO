const { getBotSettings, updateBotSettings } = require('../../database/repositories/bot-settings.repository');
const { getGroup, updateGroupSettings } = require('../../database/repositories/group.repository');
const { logAudit } = require('../audit/audit.service');

// In-memory cache for disabled features
let globalDisabled = new Set();
let globalLoaded = false;

// Per-group cache: groupJid -> Set<feature>
const groupDisabledCache = new Map();

// Map command names to canonical feature category
const COMMAND_FEATURE_MAP = {
  // Downloader
  download: 'downloader',
  play: 'downloader',
  tiktok: 'downloader',
  youtube: 'downloader',
  instagram: 'downloader',
  // Games
  games: 'games',
  game: 'games',
  quiz: 'games',
  tebakkata: 'games',
  susunkata: 'games',
  suit: 'games',
  tictactoe: 'games',
  dadu: 'games',
  coinflip: 'games',
  slot: 'games',
  roulette: 'games',
  score: 'games',
  leaderboard: 'games',
  daily: 'games',
  tebakangka: 'games',
  duel: 'games',
  tebakgambar: 'games',
  tebaklagu: 'games',
  caklontong: 'games',
  siapakahaku: 'games',
  tebakbendera: 'games',
  asahotak: 'games',
  wordle: 'games',
  // Fun
  fun: 'fun',
  cek: 'fun',
  cekbeban: 'fun',
  cekjodoh: 'fun',
  cekhargadiri: 'fun',
  cekfemboy: 'fun',
  // Tarot
  tarot: 'tarot',
  // AI
  ai: 'ai',
  chat: 'ai',
  // Converter / Sticker
  brat: 'converter',
  bratvid: 'converter',
  bratanime: 'converter',
  sticker: 'converter',
  swm: 'converter',
  toimg: 'converter',
  iqc: 'converter',
};

const KNOWN_FEATURES = ['downloader', 'games', 'fun', 'tarot', 'ai', 'converter'];

function resolveFeature(commandName = '', commandCategory = '') {
  const cmd = String(commandName).toLowerCase().trim();
  if (COMMAND_FEATURE_MAP[cmd]) return COMMAND_FEATURE_MAP[cmd];
  const cat = String(commandCategory).toLowerCase().trim();
  if (KNOWN_FEATURES.includes(cat)) return cat;
  if (KNOWN_FEATURES.includes(cmd)) return cmd;
  return null;
}

async function loadGlobalDisabled() {
  if (globalLoaded) return;
  try {
    const settings = await getBotSettings();
    const list = Array.isArray(settings?.disabledFeatures) ? settings.disabledFeatures : [];
    globalDisabled = new Set(list.map((f) => String(f).toLowerCase().trim()));
  } catch {}
  globalLoaded = true;
}

async function isFeatureDisabledGlobally(featureOrCommand, category = '') {
  await loadGlobalDisabled();
  const feature = resolveFeature(featureOrCommand, category) || String(featureOrCommand).toLowerCase().trim();
  return globalDisabled.has(feature);
}

async function setGlobalFeature(featureName, enable) {
  await loadGlobalDisabled();
  const feature = String(featureName).toLowerCase().trim();
  if (enable) {
    globalDisabled.delete(feature);
  } else {
    globalDisabled.add(feature);
  }
  try {
    await updateBotSettings({ disabledFeatures: Array.from(globalDisabled) });
  } catch {}
  await logAudit('SETTINGS', `Global feature ${feature} ${enable ? 'enabled' : 'disabled'}`);
  return !globalDisabled.has(feature);
}

async function isFeatureDisabledInGroup(groupJid, featureOrCommand, category = '') {
  if (!groupJid || !groupJid.endsWith('@g.us')) return false;

  let groupSet = groupDisabledCache.get(groupJid);
  if (!groupSet) {
    try {
      const groupData = await getGroup(groupJid);
      const list = Array.isArray(groupData?.disabledFeatures) ? groupData.disabledFeatures : [];
      groupSet = new Set(list.map((f) => String(f).toLowerCase().trim()));
      groupDisabledCache.set(groupJid, groupSet);
    } catch {
      return false;
    }
  }

  const feature = resolveFeature(featureOrCommand, category) || String(featureOrCommand).toLowerCase().trim();
  return groupSet.has(feature);
}

async function setGroupFeature(groupJid, featureName, enable) {
  if (!groupJid || !groupJid.endsWith('@g.us')) throw new Error('Hanya dapat digunakan di dalam grup.');

  let groupSet = groupDisabledCache.get(groupJid);
  if (!groupSet) {
    const groupData = await getGroup(groupJid);
    const list = Array.isArray(groupData?.disabledFeatures) ? groupData.disabledFeatures : [];
    groupSet = new Set(list.map((f) => String(f).toLowerCase().trim()));
    groupDisabledCache.set(groupJid, groupSet);
  }

  const feature = String(featureName).toLowerCase().trim();
  if (enable) {
    groupSet.delete(feature);
  } else {
    groupSet.add(feature);
  }

  await updateGroupSettings(groupJid, { disabledFeatures: Array.from(groupSet) });
  await logAudit('SETTINGS', `Group ${groupJid} feature ${feature} ${enable ? 'enabled' : 'disabled'}`);
  return !groupSet.has(feature);
}

function getGlobalDisabledList() {
  return Array.from(globalDisabled);
}

module.exports = {
  KNOWN_FEATURES,
  resolveFeature,
  isFeatureDisabledGlobally,
  setGlobalFeature,
  isFeatureDisabledInGroup,
  setGroupFeature,
  getGlobalDisabledList,
};
