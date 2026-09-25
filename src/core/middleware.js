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
  createGuard,
  createCooldownStore,
  applyCooldown,
  clearCooldown,
};
