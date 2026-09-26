const config = require('../config');

function normalizeNumber(value = '') {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/[^\d]/g, '')
    .replace(/^62/, '62');
}

function getSenderNumber(message = {}) {
  const sender = message?.sender || message?.key?.participant || message?.key?.remoteJid || '';
  return normalizeNumber(sender);
}

function getChatJid(message = {}) {
  return message?.key?.remoteJid || message?.chat || '';
}

function isGroupMessage(message = {}) {
  const chatJid = getChatJid(message);
  return typeof chatJid === 'string' && chatJid.endsWith('@g.us');
}

function isOwnerMessage(message = {}, ownerNumber = config?.owner) {
  const owner = normalizeNumber(ownerNumber);
  const sender = getSenderNumber(message);

  return !!owner && !!sender && sender === owner;
}

async function getGroupMetadata(client, message) {
  const groupJid = getChatJid(message);
  if (!isGroupMessage(message) || !client || typeof client.groupMetadata !== 'function') {
    return null;
  }

  return client.groupMetadata(groupJid);
}

function findParticipant(metadata, jid) {
  const target = String(jid || '').split(':')[0];
  return (metadata?.participants || []).find((participant) => {
    const id = String(participant?.id || '').split(':')[0];
    return id === target;
  }) || null;
}

async function isGroupAdmin(client, message) {
  const metadata = await getGroupMetadata(client, message);
  const participant = findParticipant(metadata, message?.key?.participant || message?.participant);
  return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

async function isBotAdmin(client, message) {
  const metadata = await getGroupMetadata(client, message);
  const botJid = client?.user?.id;
  const participant = findParticipant(metadata, botJid);
  return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

async function checkCommandAccess(client, message, access = 'public', args = []) {
  const requiredAccess = typeof access === 'function' ? await access(message, args) : access;
  if (requiredAccess === 'public') return { allowed: true };
  access = requiredAccess;
  const owner = isOwnerMessage(message);
  if (access === 'owner') return { allowed: owner, reason: 'owner' };
  if (!isGroupMessage(message)) return { allowed: false, reason: 'group' };
  if (access === 'group-admin' && (owner || await isGroupAdmin(client, message))) {
    return { allowed: true };
  }
  if (access === 'bot-admin' && (owner || await isBotAdmin(client, message))) {
    return { allowed: true };
  }
  return { allowed: false, reason: access };
}

function createGuard({
  validate,
  onInvalid,
  onValid,
}) {
  return async (...args) => {
    const next = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null;
    const payload = args[0];

    const isValid = typeof validate === 'function' ? await validate(payload, ...args) : true;

    if (isValid) {
      if (typeof onValid === 'function') {
        return onValid(payload, ...args);
      }

      if (typeof next === 'function') {
        return next();
      }

      return true;
    }

    if (typeof onInvalid === 'function') {
      return onInvalid(payload, ...args);
    }

    if (typeof next === 'function') {
      return false;
    }

    return false;
  };
}

function createCooldownStore() {
  const cache = new Map();

  return {
    get(key) {
      return cache.get(key) || null;
    },
    set(key, value) {
      cache.set(key, value);
      return value;
    },
    delete(key) {
      cache.delete(key);
      return true;
    },
    clear() {
      cache.clear();
      return true;
    },
  };
}

function applyCooldown(store, key, seconds = 3) {
  const now = Date.now();
  const previous = store.get(key);

  if (previous && now - previous < seconds * 1000) {
    return false;
  }

  store.set(key, now);
  return true;
}

function clearCooldown(store, key) {
  return store.delete(key);
}

module.exports = {
  normalizeNumber,
  getSenderNumber,
  getChatJid,
  isGroupMessage,
  isOwnerMessage,
  getGroupMetadata,
  isGroupAdmin,
  isBotAdmin,
  checkCommandAccess,
  createGuard,
  createCooldownStore,
  applyCooldown,
  clearCooldown,
};
