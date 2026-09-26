const config = require('../config');
const { getGroup } = require('../database/repositories/group.repository');

function normalizeNumber(value = '') {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/[^\d]/g, '');
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
  const sender = getSenderNumber(message);
  if (!sender) return false;

  const baseOwner = normalizeNumber(ownerNumber || config?.owner);
  if (baseOwner && sender === baseOwner) return true;

  // Check dynamic owners from cache/service if available
  try {
    const { getOwners } = require('../services/owner/owner.service');
    // Note: getOwners is async, but isOwnerMessage is synchronous.
    // For synchronous check, baseOwner is primary.
  } catch (e) {}

  return !!baseOwner && sender === baseOwner;
}

async function isOwnerAsync(message = {}) {
  const sender = getSenderNumber(message);
  if (!sender) return false;
  try {
    const { isOwner } = require('../services/owner/owner.service');
    return await isOwner(sender);
  } catch {
    return isOwnerMessage(message);
  }
}

async function getGroupMetadata(client, message) {
  const groupJid = getChatJid(message);
  if (!isGroupMessage(message) || !client || typeof client.groupMetadata !== 'function') {
    return null;
  }

  return client.groupMetadata(groupJid);
}

function findParticipant(metadata, jid) {
  const target = String(jid || '').split(':')[0].split('@')[0];
  return (metadata?.participants || []).find((participant) => {
    const id = String(participant?.id || '').split(':')[0].split('@')[0];
    return id === target;
  }) || null;
}

async function isGroupAdmin(client, message) {
  const metadata = await getGroupMetadata(client, message);
  if (!metadata) return false;
  const participant = findParticipant(metadata, message?.key?.participant || message?.participant);
  return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

async function isBotAdmin(client, message) {
  const metadata = await getGroupMetadata(client, message);
  if (!metadata) return false;
  const botJid = client?.user?.id;
  const participant = findParticipant(metadata, botJid);
  return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

/**
 * Validasi Permission Command dengan Admin Verification
 * User -> Group? -> Admin? -> Bot Admin? -> Execute
 */
async function checkCommandAccess(client, message, access = 'public', args = []) {
  const requiredAccess = typeof access === 'function' ? await access(message, args) : access;
  if (requiredAccess === 'public') return { allowed: true };

  const owner = await isOwnerAsync(message);
  if (requiredAccess === 'owner') {
    return { allowed: owner, reason: 'owner' };
  }

  if (!isGroupMessage(message)) {
    return { allowed: false, reason: 'group' };
  }

  // Group Admin validation: caller must be group admin or bot owner
  if (requiredAccess === 'group-admin') {
    const userIsAdmin = owner || (await isGroupAdmin(client, message));
    if (!userIsAdmin) {
      return { allowed: false, reason: 'admin' };
    }
    return { allowed: true };
  }

  // Bot Admin validation: caller must be admin AND bot must be admin
  if (requiredAccess === 'bot-admin') {
    const userIsAdmin = owner || (await isGroupAdmin(client, message));
    if (!userIsAdmin) {
      return { allowed: false, reason: 'admin' };
    }

    const botIsAdmin = await isBotAdmin(client, message);
    if (!botIsAdmin) {
      return { allowed: false, reason: 'bot-admin' };
    }

    return { allowed: true };
  }

  return { allowed: false, reason: requiredAccess };
}

/**
 * Group Access Middleware (Whitelist):
 * Message -> Is Group? -> Check Group Status (active, pending, blocked, suspended)
 * - active: continue
 * - pending: reject
 * - blocked: leave group
 * - suspended: ignore
 */
async function groupAccessMiddleware(client, message) {
  if (!isGroupMessage(message)) {
    return { allowed: true, status: 'private' };
  }

  const groupJid = getChatJid(message);
  let groupData;
  try {
    groupData = await getGroup(groupJid);
  } catch (err) {
    console.warn('[GROUP:ACCESS] Error fetching group status:', err?.message || err);
    // If DB fails, fail safe by checking owner message
    if (await isOwnerAsync(message)) return { allowed: true, status: 'active' };
    return { allowed: false, status: 'error', reason: 'Database uncontactable' };
  }

  const status = groupData?.status || 'pending';

  // Owner can always execute admin/approval commands in any group
  if (await isOwnerAsync(message)) {
    return { allowed: true, status, groupData, isOwner: true };
  }

  if (status === 'active') {
    return { allowed: true, status: 'active', groupData };
  }

  if (status === 'blocked') {
    // leave group immediately
    try {
      if (client && typeof client.groupLeave === 'function') {
        await client.groupLeave(groupJid);
      }
    } catch {}
    return { allowed: false, status: 'blocked', action: 'leave' };
  }

  if (status === 'suspended') {
    // silently ignore all messages
    return { allowed: false, status: 'suspended', action: 'ignore' };
  }

  // status === 'pending'
  return { allowed: false, status: 'pending', action: 'reject', groupData };
}

function createGuard({ validate, onInvalid, onValid }) {
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
    return false;
  };
}

function createCooldownStore() {
  const cache = new Map();
  return {
    get: (key) => cache.get(key) || null,
    set: (key, value) => {
      cache.set(key, value);
      return value;
    },
    delete: (key) => cache.delete(key),
    clear: () => cache.clear(),
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
  isOwnerAsync,
  getGroupMetadata,
  isGroupAdmin,
  isBotAdmin,
  checkCommandAccess,
  groupAccessMiddleware,
  createGuard,
  createCooldownStore,
  applyCooldown,
  clearCooldown,
};
