const { getDb } = require('../firebase');
const { createUserModel, generateDefaultProfileId } = require('../models/user.model');

function normalizeJid(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

function normalizeFieldValue(field, value) {
  const raw = String(value ?? '').trim();

  if (field === 'level' || field === 'exp' || field === 'limit' || field === 'balance' || field === 'age') {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return parsed;
  }

  if (field === 'premium') {
    return raw.toLowerCase() === 'true' || raw.toLowerCase() === 'yes' || raw.toLowerCase() === 'premium';
  }

  if (field === 'id') {
    return raw || generateDefaultProfileId();
  }

  if (field === 'username') {
    return raw.replace(/^@+/, '');
  }

  if (field === 'gender') {
    return raw || 'Unknown';
  }

  if (field === 'social') {
    return raw || '—';
  }

  return raw || '';
}

async function getUserByJid(jid) {
  const normalizedJid = normalizeJid(jid);

  if (!normalizedJid) {
    return null;
  }

  const db = await getDb();
  const snapshot = await db.collection('users').doc(normalizedJid).get();

  if (!snapshot.exists) {
    return null;
  }

  return createUserModel(snapshot.data());
}

async function saveUser(data = {}) {
  const normalizedJid = normalizeJid(data.jid);

  if (!normalizedJid) {
    throw new Error('JID is required to save user profile.');
  }

  const db = await getDb();
  const now = new Date().toISOString();
  const user = createUserModel({
    ...data,
    jid: normalizedJid,
    updatedAt: now,
  });

  await db.collection('users').doc(normalizedJid).set(user, { merge: true });

  return user;
}

async function ensureUser({ jid, name }) {
  const normalizedJid = normalizeJid(jid);

  if (!normalizedJid) {
    throw new Error('JID is required to register user.');
  }

  const existingUser = await getUserByJid(normalizedJid);

  if (existingUser) {
    const nextUser = createUserModel({
      ...existingUser,
      name: name || existingUser.name,
      jid: normalizedJid,
      updatedAt: new Date().toISOString(),
    });

    return saveUser(nextUser);
  }

  const user = createUserModel({
    jid: normalizedJid,
    name: name || 'User',
    id: generateDefaultProfileId(normalizedJid),
    gender: 'Unknown',
    username: 'anon',
    social: '—',
    age: 0,
    bio: 'No bio yet.',
    level: 1,
    exp: 0,
    limit: 20,
    balance: 0,
    premium: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return saveUser(user);
}

async function findUsersByName(query = '') {
  const rawQuery = String(query || '').trim();

  if (!rawQuery) {
    return [];
  }

  const db = await getDb();
  const snapshot = await db.collection('users').get();

  if (snapshot.empty) {
    return [];
  }

  const normalizedQuery = rawQuery.toLowerCase();

  return snapshot.docs
    .map((doc) => createUserModel(doc.data()))
    .filter((user) => {
      const name = String(user.name || '').toLowerCase();
      const jid = String(user.jid || '').toLowerCase();
      const username = String(user.username || '').toLowerCase();

      return (
        name.includes(normalizedQuery) ||
        jid.includes(normalizedQuery) ||
        username.includes(normalizedQuery) ||
        name === normalizedQuery ||
        jid === normalizedQuery ||
        username === normalizedQuery
      );
    })
    .sort((a, b) => {
      const aExact = a.name.toLowerCase() === normalizedQuery || a.jid.toLowerCase() === normalizedQuery || a.username.toLowerCase() === normalizedQuery;
      const bExact = b.name.toLowerCase() === normalizedQuery || b.jid.toLowerCase() === normalizedQuery || b.username.toLowerCase() === normalizedQuery;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });
}

async function findUserByQuery(query = '') {
  const rawQuery = String(query || '').trim();

  if (!rawQuery) {
    return null;
  }

  const byJid = await getUserByJid(rawQuery);
  if (byJid) {
    return byJid;
  }

  const matches = await findUsersByName(rawQuery);
  if (matches.length === 0) {
    return null;
  }

  return matches[0];
}

async function updateProfileField(jid, fieldName, value) {
  const normalizedJid = normalizeJid(jid);
  const safeField = String(fieldName || '').trim().toLowerCase();

  if (!normalizedJid || !safeField) {
    throw new Error('JID and field name are required.');
  }

  const allowedFields = ['id', 'gender', 'username', 'social', 'age', 'bio', 'name'];
  if (!allowedFields.includes(safeField)) {
    throw new Error(`Unsupported profile field: ${safeField}`);
  }

  const currentUser = await getUserByJid(normalizedJid);
  if (!currentUser) {
    throw new Error('User not found. Please register first.');
  }

  let nextValue = normalizeFieldValue(safeField, value);

  if (safeField === 'id' && !nextValue) {
    nextValue = generateDefaultProfileId(normalizedJid);
  }

  const updatedUser = createUserModel({
    ...currentUser,
    [safeField]: nextValue,
    jid: normalizedJid,
    updatedAt: new Date().toISOString(),
  });

  await saveUser(updatedUser);
  return updatedUser;
}

module.exports = {
  normalizeJid,
  getUserByJid,
  saveUser,
  ensureUser,
  findUsersByName,
  findUserByQuery,
  updateProfileField,
};
