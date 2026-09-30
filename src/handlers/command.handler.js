const { messages } = require('../messages');
const { replyText } = require('../core/reply');
const { resolveUserAndScope, checkCommandAccess } = require('../core/middleware');
const { hasRole, ROLES } = require('../core/roles');
const { checkCooldown } = require('../core/cooldown');
const { checkRateLimit, RATE_LIMIT_MESSAGE } = require('../core/rate-limit');
const { isBanned, getBanInfo } = require('../services/security/blacklist.service');
const { isMaintenanceActive, MAINTENANCE_MESSAGE } = require('../services/system/system-control.service');
const {
  isFeatureDisabledGlobally,
  isFeatureDisabledInGroup,
  isCommandDisabledGlobally,
  isCommandDisabledInGroup,
  resolveFeature,
} = require('../services/feature/feature-control.service');
const {
  checkAndConsumeScopedLimit,
} = require('../database/repositories/user-scope.repository');
const { calculateLimitPrice } = require('../services/limit/limit.service');
const { sendNativeFlow } = require('../utils/interactive');
const { logger } = require('../utils/logger');

// Commands that guests (unregistered users) are permitted to run
const GUEST_COMMANDS = new Set([
  'register', 'daftar',
  'menu', 'help', 'start', 'bantuan', 'menuhelp',
  'ping', 'p',
  'owner', 'ownerinfo', 'rules', 'runtime', 'status', 'donate', 'dev', 'github', 'portfolio',
  'settings', 'setting', 'enable', 'disable',
  'group', 'groupmenu', 'gcmenu',
  'privacy',
]);

// Commands that do not consume limits for registered users
const FREE_COMMANDS = new Set([
  'register', 'daftar',
  'menu', 'help', 'start', 'bantuan', 'menuhelp',
  'store', 'buy', 'toko', 'belilimit',
  'limit', 'ceklimit', 'kuota',
  'profile', 'prof', 'idcard', 'id',
  'editprofile', 'setprofile', 'updateprofile',
  'score', 'rank', 'level', 'leaderboard', 'lb', 'top', 'daily', 'claim',
  'ping', 'p',
  'owner', 'ownerinfo', 'rules', 'runtime', 'status', 'donate', 'dev', 'github', 'portfolio',
  'games', 'game', 'gamemenu', 'fun',
  'afk',
  'settings', 'setting', 'enable', 'disable',
  'group', 'groupmenu', 'gcmenu',
  'antilink', 'addlink', 'dellink', 'listlink',
  'antitoxic', 'addbadword', 'delbadword', 'listbadword',
  'approvegroup', 'accgroup', 'acgc', 'leavegroup', 'outgroup', 'keluargrup',
  'hidetag', 'ta', 'grouplink', 'groupinfo', 'membercount', 'messagecount',
  'kick', 'promote', 'demote', 'opengroup', 'closegroup', 'pinchat', 'unpinchat',
  'setlimit', 'changelimit', 'addlimit', 'restart', 'backup', 'listowner', 'addowner', 'delowner', 'deleteowner',
  // Security & Control commands
  'banuser', 'unbanuser', 'checkban', 'listban',
  'audit',
  'shutdown', 'maintenance',
  'command', 'disablecmd', 'enablecmd',
  'privacy',
  // Downloader selection
  'dlpick', 'downloadpick', 'pilihdl',
]);

async function handleLimitExhausted(client, message, senderJid, remaining, cost) {
  const p10 = calculateLimitPrice(remaining, 10);
  const body = messages.store.limitExhausted({
    remaining,
    required: cost,
    p10,
  });

  const jid = message?.key?.remoteJid;

  try {
    const sections = [
      {
        title: 'LIMIT & STORE',
        rows: [
          { id: 'store:buy_10', title: 'Beli +10 Limit', description: `Biaya: ${p10} XP` },
          { id: 'menu_utama:store', title: 'Buka Toko', description: 'Lihat semua paket limit' },
        ],
      },
    ];

    await sendNativeFlow(client, jid, message, {
      title: 'LIMIT HABIS',
      body,
      sections,
    });
  } catch (err) {
    console.warn('[LIMIT] Interactive flow failed, fallback to text:', err?.message || err);
    await replyText(
      client,
      message,
      body + '\n\nKetik ```.buy 10``` untuk membeli atau ```.store``` untuk membuka toko.'
    );
  }
}

async function handleCommand(client, message, command, args = []) {
  if (!command || typeof command.execute !== 'function') {
    return false;
  }

  const commandName = (command.name || '').toLowerCase();
  const jid = message?.key?.remoteJid;

  // 1. User & Scope Resolution
  const ctx = await resolveUserAndScope(client, message);
  const {
    senderJid,
    groupJid,
    scopeId,
    isOwner,
    isGroupAdmin,
    botIsAdmin,
    globalUser,
    scopedUser,
    isRegistered,
    effectiveRole,
  } = ctx;

  // 2. Granular Ban Checks
  // 2a. Global Bot Ban
  if (senderJid && (await isBanned(senderJid))) {
    const banInfo = await getBanInfo(senderJid);
    await replyText(
      client,
      message,
      `❌ *KAMU DIBLACKLIST*\n\nKamu telah diban dari ALBEDO.\nAlasan: ${banInfo?.reason || 'Melanggar aturan'}`
    );
    return false;
  }

  // 2b. Scoped Group Ban
  if (scopedUser?.banned && !isOwner) {
    await replyText(
      client,
      message,
      `❌ *AKSES DIBATASI*\n\nKamu telah diban di grup ini.\nAlasan: ${scopedUser.banReason || 'Melanggar aturan grup'}`
    );
    return false;
  }

  // 2c. Command Ban per user
  if (scopedUser?.bannedCommands?.includes(commandName) && !isOwner) {
    await replyText(
      client,
      message,
      `❌ *COMMAND TERKUNCI*\n\nAkses perintah .${commandName} dinonaktifkan untuk akun kamu.`
    );
    return false;
  }

  // 3. Anti Abuse / Rate Limit Check (5 command / 10 detik)
  const rateLimit = checkRateLimit({ senderJid, groupJid, isOwner });
  if (!rateLimit.allowed) {
    await replyText(client, message, RATE_LIMIT_MESSAGE);
    return false;
  }

  // 4. Maintenance Mode Check (Owner bypasses)
  if (isMaintenanceActive() && !isOwner) {
    const isPublic = command.isPublic || GUEST_COMMANDS.has(commandName);
    if (!isPublic) {
      await replyText(client, message, MAINTENANCE_MESSAGE);
      return false;
    }
  }

  // 5. Command Lock & Feature Control Checks
  if (!isOwner) {
    // 5a. Global Command Lock
    if (await isCommandDisabledGlobally(commandName)) {
      await replyText(
        client,
        message,
        `⚠️ *COMMAND DISABLED*\n\nPerintah .${commandName} sedang dinonaktifkan secara global.`
      );
      return false;
    }

    // 5b. Per-Group Command Lock
    if (groupJid && (await isCommandDisabledInGroup(groupJid, commandName))) {
      await replyText(
        client,
        message,
        `⚠️ *COMMAND DISABLED IN THIS GROUP*\n\nPerintah .${commandName} dinonaktifkan di grup ini oleh admin.`
      );
      return false;
    }

    // 5c. Feature Kill Switches
    const category = command.category || '';
    const resolvedFeat = resolveFeature(commandName, category);
    if (resolvedFeat) {
      if (await isFeatureDisabledGlobally(commandName, category)) {
        await replyText(
          client,
          message,
          `⚠️ *FEATURE DISABLED*\n\nFitur ${resolvedFeat.toUpperCase()} sementara tidak tersedia.`
        );
        return false;
      }

      if (groupJid && (await isFeatureDisabledInGroup(groupJid, commandName, category))) {
        await replyText(
          client,
          message,
          `⚠️ *FEATURE DISABLED IN THIS GROUP*\n\nFitur ${resolvedFeat.toUpperCase()} dinonaktifkan di grup ini oleh admin.`
        );
        return false;
      }
    }
  }

  // 6. Role & Permission Gatekeeper
  const isGuestAllowed = command.isPublic || GUEST_COMMANDS.has(commandName);

  if (!isGuestAllowed && !isOwner) {
    // Must be registered
    if (!isRegistered) {
      await replyText(client, message, messages.profile.register.required);
      return false;
    }

    // Role verification
    const allowedRoles = command.roles || [ROLES.USER, ROLES.PREMIUM, ROLES.VIP, ROLES.OWNER];
    const roleGranted = hasRole(effectiveRole, allowedRoles);

    if (!roleGranted) {
      if (allowedRoles.includes(ROLES.GROUP_ADMIN) || allowedRoles.includes(ROLES.MODERATOR)) {
        await replyText(client, message, 'Khusus admin grup dan owner bot.');
      } else if (allowedRoles.includes(ROLES.OWNER) || allowedRoles.includes(ROLES.SUPEROWNER)) {
        await replyText(client, message, 'Khusus Owner bot.');
      } else if (allowedRoles.includes(ROLES.VIP) || allowedRoles.includes(ROLES.PREMIUM)) {
        await replyText(client, message, 'Fitur ini khusus untuk pengguna VIP / Premium.');
      } else {
        await replyText(client, message, 'Kamu tidak memiliki akses untuk perintah ini.');
      }
      return false;
    }

    // Legacy permission fallback check (bot-admin, etc.)
    const reqPerm = command.permission || command.access || 'USER';
    try {
      const access = await checkCommandAccess(client, message, reqPerm, args);
      if (!access.allowed) {
        if (access.reason === 'bot-admin') {
          await replyText(
            client,
            message,
            '❌ BOT NOT ADMIN\n\nALBEDO membutuhkan permission admin untuk menjalankan command ini.'
          );
        } else {
          await replyText(client, message, 'Khusus admin grup dan owner bot.');
        }
        return false;
      }
    } catch {}
  }

  // 7. Cooldown Check (Owner & VIP bypass)
  const cooldownSec = command.cooldown || (commandName === 'play' || commandName === 'youtube' ? 15 : (commandName === 'tiktok' ? 10 : 0));
  const isCooldownBypass = isOwner || effectiveRole === ROLES.VIP || effectiveRole === ROLES.SUPEROWNER;
  const cooldownRes = checkCooldown(senderJid, scopeId, commandName, cooldownSec, isCooldownBypass);

  if (!cooldownRes.allowed) {
    await replyText(
      client,
      message,
      `⏳ *COOLDOWN AKTIF*\n\nMohon tunggu *${cooldownRes.remainingSec} detik* sebelum menggunakan .${commandName} lagi.`
    );
    return false;
  }

  // 8. Scoped Limit Check (Multi-Tenant per Group + DM)
  const isFree = command.isFree || command.limit === 0 || FREE_COMMANDS.has(commandName);
  if (!isFree && !isOwner) {
    const cost = command.limit || command.limitCost || 1;
    const limitRes = await checkAndConsumeScopedLimit(senderJid, scopeId, cost, isOwner);

    if (!limitRes.allowed) {
      await handleLimitExhausted(client, message, senderJid, limitRes.remaining, cost);
      return false;
    }
  }

  // 9. Execute Command with Rich Context
  const startTime = Date.now();
  try {
    await command.execute(client, message, args, ctx);
    const elapsed = Date.now() - startTime;
    logger.cmd(commandName);
    logger.resp(commandName, elapsed);
    return true;
  } catch (error) {
    const senderNumber = senderJid ? senderJid.split('@')[0] : 'unknown';
    logger.error('Command execution failed', {
      command: `.${commandName}`,
      user: senderNumber,
      module: `command.${commandName}`,
      reason: error?.message || 'Internal error',
    });

    if (jid) {
      await replyText(client, message, messages.bot.genericError());
    }

    return false;
  }
}

module.exports = {
  GUEST_COMMANDS,
  FREE_COMMANDS,
  handleCommand,
};
