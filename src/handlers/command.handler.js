const { messages } = require('../messages');
const { replyText } = require('../core/reply');
const { isOwnerMessage, checkCommandAccess } = require('../core/middleware');
const { getSenderJid } = require('../utils/message.utils');
const { getUserByJid } = require('../database/repositories/user.repository');
const { checkAndConsumeLimit, calculateLimitPrice } = require('../features/limit/limit.service');
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

module.exports = {
  GUEST_COMMANDS,
  FREE_COMMANDS,
  handleCommand: async (client, message, command, args = []) => {
    if (!command || typeof command.execute !== 'function') {
      return false;
    }

    const commandName = (command.name || '').toLowerCase();
    const isOwner = isOwnerMessage(message);
    const senderJid = getSenderJid(message);

    try {
      const access = await checkCommandAccess(client, message, command.access || 'public', args);
      if (!access.allowed) {
        if (access.reason === 'bot-admin') {
          await replyText(
            client,
            message,
            '❌ BOT NOT ADMIN\n\nALBEDO membutuhkan permission admin untuk menjalankan command ini.'
          );
        } else if (access.reason === 'admin') {
          await replyText(client, message, 'Khusus admin grup dan owner bot.');
        } else if (access.reason === 'group') {
          await replyText(client, message, 'Perintah ini hanya dapat digunakan di dalam grup.');
        } else {
          await replyText(client, message, 'Khusus admin grup dan owner bot.');
        }
        return false;
      }
    } catch (error) {
      console.warn('[PERMISSION] Could not verify command access:', error?.message || error);
      await replyText(client, message, 'Gagal memverifikasi izin grup. Coba lagi nanti.');
      return false;
    }

    // 1. Registration Check: All feature commands require user to be registered
    const isGuestAllowed = GUEST_COMMANDS.has(commandName);
    if (!isGuestAllowed && !isOwner) {
      if (!senderJid) return false;
      const user = await getUserByJid(senderJid);
      if (!user) {
        await replyText(client, message, messages.profile.register.required);
        return false;
      }
    }

    // 2. Limit Check for non-free commands and non-owner users
    const isFree = command.isFree || FREE_COMMANDS.has(commandName);
    if (!isFree && !isOwner) {
      const cost = command.limitCost || 1;

      const limitRes = await checkAndConsumeLimit(senderJid, cost);
      if (!limitRes.allowed) {
        await handleLimitExhausted(client, message, senderJid, limitRes.remaining, cost);
        return false;
      }
    }

    const startTime = Date.now();
    try {
      await command.execute(client, message, args);
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
      const jid = message?.key?.remoteJid;

      if (jid) {
        await replyText(client, message, messages.bot.genericError());
      }

      return false;
    }
  },
};
