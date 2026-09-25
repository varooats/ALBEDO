function normalizeName(value) {
  const name = String(value || 'User').trim();
  return name.length > 0 ? name : 'User';
}

function normalizeJid(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

function normalizeText(value, fallback = '') {
  const text = String(value ?? fallback).trim();
  return text.length > 0 ? text : fallback;
}

function normalizeNumber(value, fallback = 0) {
  const casted = Number(value ?? fallback);
  return Number.isFinite(casted) ? casted : fallback;
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return Boolean(value);
}

function generateDefaultProfileId(jid = '') {
  const base = normalizeJid(jid).replace(/[^0-9]/g, '').slice(-6) || '000001';
  return `ALB-${String(base).padStart(6, '0')}`;
}

function createUserModel(data = {}) {
  const now = new Date().toISOString();
  const jid = normalizeJid(data.jid);

  const baseLimit = normalizeNumber(data.maxLimit || data.limit, 20);

  return {
    jid,
    name: normalizeName(data.name),
    id: normalizeText(data.id || generateDefaultProfileId(jid), 'ALB-000001'),
    gender: normalizeText(data.gender, 'Unknown'),
    username: normalizeText(data.username, 'anon'),
    social: normalizeText(data.social, '—'),
    age: normalizeNumber(data.age, 0),
    bio: normalizeText(data.bio, 'No bio yet.'),
    level: normalizeNumber(data.level, 1),
    exp: normalizeNumber(data.exp, 0),
    limit: normalizeNumber(data.limit, baseLimit),
    maxLimit: Math.max(20, baseLimit),
    balance: normalizeNumber(data.balance, 0),
    premium: normalizeBoolean(data.premium),
    lastDaily: normalizeText(data.lastDaily, ''),
    lastLimitReset: normalizeText(data.lastLimitReset, ''),
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

module.exports = {
  createUserModel,
  generateDefaultProfileId,
};
