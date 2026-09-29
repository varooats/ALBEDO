const config = require('../config');
const { getGroup } = require('../database/repositories/group.repository');
const {
  getUserRole,
  isSuperOwner,
  isOwner,
  ROLE_RANKS,
} = require('../services/owner/owner.service');
const { logAudit } = require('../services/audit/audit.service');

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
  return !!baseOwner && sender === baseOwner;
}

async function isOwnerAsync(message = {}) {
  const sender = getSenderNumber(message);
  if (!sender) return false;
  return isOwner(sender);
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
 * Validasi Permission Command dengan Hirarki:
 * SUPEROWNER > OWNER > ADMIN > GROUP_ADMIN > USER
 */
async function checkCommandAccess(client, message, accessOrPerm = 'USER', args = []) {
  const perm = typeof accessOrPerm === 'function' ? await accessOrPerm(message, args) : accessOrPerm;
  const upper = String(perm || 'USER').toUpperCase();

  let requiredRole = upper;
  let requireBotAdmin = false;

  if (perm === 'public' || upper === 'USER') requiredRole = 'USER';
  else if (perm === 'owner' || upper === 'OWNER') requiredRole = 'OWNER';
  else if (upper === 'SUPEROWNER') requiredRole = 'SUPEROWNER';
  else if (upper === 'ADMIN') requiredRole = 'ADMIN';
  else if (perm === 'group-admin' || upper === 'GROUP_ADMIN') requiredRole = 'GROUP_ADMIN';
  else if (perm === 'bot-admin') {
    requiredRole = 'GROUP_ADMIN';
    requireBotAdmin = true;
  }

  if (requiredRole === 'USER') return { allowed: true };

  const senderNumber = getSenderNumber(message);
  const botRole = await getUserRole(senderNumber);
  const botRank = ROLE_RANKS[botRole] || 0;

  if (requiredRole === 'SUPEROWNER') {
    if (botRole === 'SUPEROWNER') return { allowed: true };
    return { allowed: false, reason: 'superowner' };
  }

  if (requiredRole === 'OWNER') {
    if (botRank >= ROLE_RANKS.OWNER) return { allowed: true };
    return { allowed: false, reason: 'owner' };
  }

  if (requiredRole === 'ADMIN') {
    if (botRank >= ROLE_RANKS.ADMIN) return { allowed: true };
    return { allowed: false, reason: 'admin' };
  }

  if (requiredRole === 'GROUP_ADMIN') {
    if (!isGroupMessage(message)) {
      return { allowed: false, reason: 'group' };
    }

    const isGrpAdmin = (botRank >= ROLE_RANKS.ADMIN) || (await isGroupAdmin(client, message));
    if (!isGrpAdmin) {
      return { allowed: false, reason: 'admin' };
    }

    if (requireBotAdmin) {
      const botIsAdmin = await isBotAdmin(client, message);
      if (!botIsAdmin) {
        return { allowed: false, reason: 'bot-admin' };
      }
    }

    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Validasi Anti Self-Target / Dangerous Actions
 * Mencegah: kick/demote bot, kick/demote target dengan permission lebih tinggi
 */
async function validateActionTarget(client, message, targetJid) {
  const senderNumber = getSenderNumber(message);
  const botNumber = normalizeNumber(client?.user?.id);
  const targetNumber = normalizeNumber(targetJid);

  if (!targetNumber) return { allowed: true };

  // 1. Bot sendiri tidak boleh jadi target
  if (botNumber && targetNumber === botNumber) {
    await logAudit('SECURITY', `Dangerous action blocked: target is bot (${botNumber})`, { sender: senderNumber });
    return {
      allowed: false,
      reason: 'bot-target',
      message: '❌ *ACTION BLOCKED*\n\nTarget memiliki permission\nyang lebih tinggi daripada kamu.',
    };
  }

  // 2. Cek hierarki
  const senderRole = await getUserRole(senderNumber);
  const targetRole = await getUserRole(targetNumber);

  let senderRank = ROLE_RANKS[senderRole] || 0;
  let targetRank = ROLE_RANKS[targetRole] || 0;

  if (isGroupMessage(message)) {
    const isSenderGroupAdmin = await isGroupAdmin(client, message);
    if (isSenderGroupAdmin && senderRank < ROLE_RANKS.GROUP_ADMIN) {
      senderRank = ROLE_RANKS.GROUP_ADMIN;
    }

    const metadata = await getGroupMetadata(client, message);
    const targetParticipant = findParticipant(metadata, targetJid);
    const isTargetGroupAdmin = targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin';
    if (isTargetGroupAdmin && targetRank < ROLE_RANKS.GROUP_ADMIN) {
      targetRank = ROLE_RANKS.GROUP_ADMIN;
    }
  }

  // Jika target memiliki rank lebih tinggi atau setara admin/owner
  if (targetRank > senderRank || (targetRank >= ROLE_RANKS.ADMIN && senderRank <= targetRank)) {
    await logAudit('SECURITY', `Dangerous action blocked: @${targetNumber} (rank ${targetRank}) >= @${senderNumber} (rank ${senderRank})`);
    return {
      allowed: false,
      reason: 'higher-permission',
      message: '❌ *ACTION BLOCKED*\n\nTarget memiliki permission\nyang lebih tinggi daripada kamu.',
    };
  }

  return { allowed: true };
}

/**
 * Group Access Middleware (Whitelist)
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
    if (await isOwnerAsync(message)) return { allowed: true, status: 'active' };
    return { allowed: false, status: 'error', reason: 'Database uncontactable' };
  }

  const status = groupData?.status || 'pending';

  if (await isOwnerAsync(message)) {
    return { allowed: true, status, groupData, isOwner: true };
  }

  if (status === 'active') {
    return { allowed: true, status: 'active', groupData };
  }

  if (status === 'blocked') {
    try {
      if (client && typeof client.groupLeave === 'function') {
        await client.groupLeave(groupJid);
      }
    } catch {}
    return { allowed: false, status: 'blocked', action: 'leave' };
  }

  if (status === 'suspended') {
    return { allowed: false, status: 'suspended', action: 'ignore' };
  }

  return { allowed: false, status: 'pending', action: 'reject', groupData };
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
  validateActionTarget,
  groupAccessMiddleware,
};
