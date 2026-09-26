const { getGroupSettings, updateGroupSettings } = require('../../database/repositories/group.repository');

// Extract naked domain from a text that may contain a URL
const URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,})/g;
const WHATSAPP_DOMAIN = 'chat.whatsapp.com';

async function incrementMessageCount(groupJid) {
  try {
    const settings = await getGroupSettings(groupJid);
    const now = new Date();
    const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await updateGroupSettings(groupJid, {
      messageCount: (settings.messageCount || 0) + 1,
      [`messageCountByDay.${day}`]: ((settings.messageCountByDay || {})[day] || 0) + 1,
      [`messageCountByMonth.${month}`]: ((settings.messageCountByMonth || {})[month] || 0) + 1,
    });
  } catch {
    // silent — counter failure must never block message handling
  }
}

async function enforceAntilink(client, message, groupJid) {
  try {
    const settings = await getGroupSettings(groupJid);
    const { antilink, links } = settings;

    if (!antilink || antilink === 'off') return false;

    const text = message?.message?.conversation
      || message?.message?.extendedTextMessage?.text
      || message?.message?.imageMessage?.caption
      || message?.message?.videoMessage?.caption
      || '';

    if (!text) return false;

    const found = [...text.matchAll(URL_PATTERN)].map((m) => m[1].toLowerCase());
    if (!found.length) return false;

    let matched = false;
    if (antilink === 'all') {
      matched = true;
    } else if (antilink === 'custom') {
      const blacklist = Array.isArray(links) ? links.map((l) => l.toLowerCase()) : [];
      matched = found.some((domain) => blacklist.includes(domain));
    }

    if (!matched) return false;

    const senderJid = message?.key?.participant;
    if (senderJid) {
      try {
        await client.groupParticipantsUpdate(groupJid, [senderJid], 'remove');
      } catch {
        // bot may not have admin rights; try delete message only
      }
    }

    try {
      await client.sendMessage(groupJid, { delete: message.key });
    } catch {
      // ignore delete failure
    }

    return true;
  } catch {
    return false;
  }
}

async function enforceAntitoxic(client, message, groupJid) {
  try {
    const settings = await getGroupSettings(groupJid);
    if (!settings.antitoxic) return false;

    const badwords = Array.isArray(settings.badwords) ? settings.badwords.map((w) => w.toLowerCase()) : [];
    if (!badwords.length) return false;

    const text = (message?.message?.conversation
      || message?.message?.extendedTextMessage?.text
      || '').toLowerCase();

    if (!text) return false;

    const hasViolation = badwords.some((word) => text.includes(word));
    if (!hasViolation) return false;

    try {
      await client.sendMessage(groupJid, { delete: message.key });
    } catch {
      // ignore
    }

    return true;
  } catch {
    return false;
  }
}

module.exports = { incrementMessageCount, enforceAntilink, enforceAntitoxic };
