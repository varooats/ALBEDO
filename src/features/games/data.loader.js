const fs = require('fs');
const path = require('path');

const dataCache = new Map();

function loadJson(filename, fallback = []) {
  if (dataCache.has(filename)) {
    return dataCache.get(filename);
  }

  const filePath = path.resolve(__dirname, '../../data', filename);
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const result = Array.isArray(parsed) ? parsed : fallback;
    dataCache.set(filename, result);
    return result;
  } catch (error) {
    console.warn(`[DATA] Failed to load ${filename}:`, error.message);
    return fallback;
  }
}

function pickRandom(arr = []) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  loadJson,
  pickRandom,
  getTebakGambar: () => loadJson('tebakgambar.json'),
  getTebakKata: () => loadJson('tebakkata.json'),
  getSusunKata: () => loadJson('susunkata.json'),
  getTebakLagu: () => loadJson('tebaklagu.json'),
  getCakLontong: () => loadJson('caklontong.json'),
  getSiapakahAku: () => loadJson('siapakahaku.json'),
  getTebakBendera: () => loadJson('tebakbendera.json'),
  getAsahOtak: () => loadJson('asahotak.json'),
  getTebakTebakan: () => loadJson('tebaktebakan.json'),
  getTebakLirik: () => loadJson('tebaklirik.json'),
  getTebakGame: () => loadJson('tebakgame.json'),
  getTebakHewan: () => loadJson('tebakhewan.json'),
};
