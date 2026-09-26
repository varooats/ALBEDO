const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const {
  resolveMentionJids,
  getSenderJid,
  jidToMentionName,
  formatCurrency,
} = require('../../utils/message');

const {
  defaultResponses,
  personalResponses,
  pairResponses,
  jodohResponses,
  hargaDiriQuotes,
  formatPersonalBox,
  formatPairBox,
} = messages.fun;

function randomFrom(array = []) {
  if (!Array.isArray(array) || array.length === 0) return '';
  return array[Math.floor(Math.random() * array.length)];
}

function getPercentRange(value) {
  if (value < 20) return 'veryLow';
  if (value < 40) return 'low';
  if (value < 60) return 'mid';
  if (value < 80) return 'high';
  return 'veryHigh';
}

/**
 * Fetch group participants prioritizing real phone numbers (s.whatsapp.net) over internal LID
 */
async function getGroupParticipants(client, message) {
  const remoteJid = message?.key?.remoteJid;
  if (!remoteJid || !String(remoteJid).endsWith('@g.us')) return [];

  try {
    const metadata = await client.groupMetadata(remoteJid);
    const rawList = metadata?.participants || [];
    const result = [];

    for (const p of rawList) {
      // Baileys provides: id (often @lid or @s.whatsapp.net), jid (phone @s.whatsapp.net), lid
      let bestJid = null;
      if (p?.jid && p.jid.endsWith('@s.whatsapp.net')) {
        bestJid = p.jid;
      } else if (p?.id && p.id.endsWith('@s.whatsapp.net')) {
        bestJid = p.id;
      } else if (p?.jid) {
        bestJid = p.jid;
      } else if (p?.id) {
        bestJid = p.id;
      }

      if (bestJid && !bestJid.endsWith('@lid')) {
        result.push(bestJid);
      }
    }

    // Fallback if all were lid: take any id
    if (result.length === 0) {
      for (const p of rawList) {
        if (p?.jid || p?.id) result.push(p.jid || p.id);
      }
    }

    return result.filter(Boolean);
  } catch (error) {
    console.error('[FUN] Failed to get group metadata:', error?.message || error);
    return [];
  }
}

async function pickRandomGroupMember(client, message, exclude = []) {
  const participants = await getGroupParticipants(client, message);
  if (!participants.length) return null;

  const excluded = new Set(exclude.filter(Boolean).map(String));
  const available = participants.filter((jid) => !excluded.has(String(jid)));
  return available.length ? randomFrom(available) : null;
}

function resolvePersonalTarget(message, args = []) {
  const sender = getSenderJid(message);
  const mentioned = resolveMentionJids(message);

  if (mentioned.length > 0) {
    return { jid: mentioned[0], mentioned: true };
  }

  if (args.length > 0) {
    const first = String(args[0] || '').toLowerCase();
    if (first === 'me' || first === 'self' || first === '@me') {
      return { jid: sender, mentioned: false };
    }
    if (/^\d+$/.test(first)) {
      return { jid: `${first}@s.whatsapp.net`, mentioned: true };
    }
    if (first.startsWith('@')) {
      const raw = first.replace(/^@/, '').replace(/[^0-9]/g, '');
      if (raw) return { jid: `${raw}@s.whatsapp.net`, mentioned: true };
    }
  }

  return { jid: sender, mentioned: false };
}

async function pickTwoTargets(client, message, args = []) {
  const sender = getSenderJid(message);
  const mentioned = resolveMentionJids(message);

  if (mentioned.length >= 2) {
    return [mentioned[0], mentioned[1]];
  }
  if (mentioned.length === 1) {
    const target = mentioned[0];
    const partner = await pickRandomGroupMember(client, message, [target]);
    return [target, partner || sender];
  }

  const partner = await pickRandomGroupMember(client, message, [sender]);
  return [sender, partner || sender];
}

function createPersonalCommand(commandName, opts = {}) {
  const title = opts.title || `CEK ${commandName.replace(/^cek/, '').toUpperCase()}`;
  const data = personalResponses[commandName] || {
    label: opts.label || 'Level',
    ranges: defaultResponses,
  };

  return createCommand({
    name: commandName,
    aliases: [],
    description: `Fun command ${commandName}`,
    execute: async (client, message, args = []) => {
      const target = resolvePersonalTarget(message, args);
      if (!target.jid) {
        await replyText(client, message, 'Tidak dapat menentukan target.');
        return true;
      }

      const value = Math.floor(Math.random() * 101);
      const range = getPercentRange(value);
      const quote = randomFrom(data.ranges?.[range] || defaultResponses[range]);

      const text = formatPersonalBox({
        title,
        targetJid: target.jid,
        showTarget: true,             // always show — tag is the point
        bodyLabel: data.label,
        bodyValue: `${value}%`,
        quote,
        mentionName: jidToMentionName(target.jid),
      });

      // always pass mentions so WhatsApp makes the @number clickable
      await replyText(client, message, text, { mentions: [target.jid] });
      return true;
    },
  });
}

function createPairCommand(commandName, opts = {}) {
  const title = opts.title || `CEK ${commandName.replace(/^cek/, '').toUpperCase()}`;
  const data = pairResponses[commandName] || {
    label: 'Kecocokan',
    ranges: defaultResponses,
  };

  return createCommand({
    name: commandName,
    aliases: [],
    description: `Compatibility command ${commandName}`,
    execute: async (client, message, args = []) => {
      const [first, second] = await pickTwoTargets(client, message, args);
      if (!first || !second) {
        await replyText(client, message, 'Tidak dapat menemukan dua target.');
        return true;
      }

      const value = Math.floor(Math.random() * 101);
      const range = getPercentRange(value);
      const quote = randomFrom(data.ranges?.[range] || defaultResponses[range]);

      const text = formatPairBox({
        title,
        firstMention: jidToMentionName(first),
        secondMention: jidToMentionName(second),
        bodyLabel: data.label,
        bodyValue: `${value}%`,
        quote,
      });

      await replyText(client, message, text, { mentions: [first, second] });
      return true;
    },
  });
}

function createCekJodohCommand() {
  return createCommand({
    name: 'cekjodoh',
    aliases: [],
    description: 'Mencari jodoh random di grup',
    execute: async (client, message) => {
      const sender = getSenderJid(message);
      const mentioned = resolveMentionJids(message);

      let first;
      let second;

      if (mentioned.length >= 2) {
        first = mentioned[0];
        second = mentioned[1];
      } else {
        first = mentioned.length === 1 ? mentioned[0] : sender;
        if (!first) {
          await replyText(client, message, 'Tidak dapat menentukan target.');
          return true;
        }
        second = await pickRandomGroupMember(client, message, [first]);
        if (!second) {
          await replyText(client, message, 'Tidak menemukan kandidat jodoh di grup.');
          return true;
        }
      }

      const value = Math.floor(Math.random() * 101);
      const range = getPercentRange(value);
      const quote = randomFrom(jodohResponses[range]);

      const text = formatPairBox({
        title: 'CEK JODOH',
        firstMention: jidToMentionName(first),
        secondMention: jidToMentionName(second),
        bodyLabel: 'Kecocokan',
        bodyValue: `${value}%`,
        quote,
      });

      await replyText(client, message, text, { mentions: [first, second] });
      return true;
    },
  });
}

function createHargaDiriCommand() {
  return createCommand({
    name: 'cekhargadiri',
    aliases: [],
    description: 'Mengukur harga diri',
    execute: async (client, message, args = []) => {
      const target = resolvePersonalTarget(message, args);
      if (!target.jid) {
        await replyText(client, message, 'Target tidak ditemukan.');
        return true;
      }

      const value = Math.floor(Math.random() * 999001) + 1000;
      let quote;

      if (value < 50000) quote = randomFrom(hargaDiriQuotes.low);
      else if (value < 250000) quote = randomFrom(hargaDiriQuotes.mediumLow);
      else if (value < 500000) quote = randomFrom(hargaDiriQuotes.medium);
      else if (value < 800000) quote = randomFrom(hargaDiriQuotes.high);
      else quote = randomFrom(hargaDiriQuotes.sultan);

      const text = formatPersonalBox({
        title: 'CEK HARGA DIRI',
        targetJid: target.jid,
        showTarget: true,
        bodyLabel: 'Harga',
        bodyValue: `Rp ${formatCurrency(value)}`,
        quote,
        mentionName: jidToMentionName(target.jid),
      });

      await replyText(client, message, text, { mentions: [target.jid] });
      return true;
    },
  });
}

const personalCommands = [
  'cekbeban', 'cekfemboy', 'cektampan', 'cekcantik', 'cekdongo',
  'cekmiskin', 'cekboros', 'cekmalas', 'cekrajin', 'cekimut',
  'cekgalak', 'cekbucin', 'ceksetia', 'cektoxic', 'cekngantuk',
  'ceklapar', 'cekgila', 'cekmesum', 'cekkepo', 'cekjulid',
  'cekansos', 'cekhalu', 'cekalay', 'cekbadut', 'cekmager',
  'cekpanik', 'cekdrama', 'cekkampungan', 'cekredflag', 'cekgreenflag',
  'cekwaras',
];

const pairCommands = ['cekcocok', 'cekchemistry', 'ceklove', 'cekfriendship', 'cekmusuhan'];

const commands = [
  ...personalCommands.map((name) => createPersonalCommand(name)),
  ...pairCommands.map((name) => createPairCommand(name)),
  createCekJodohCommand(),
  createHargaDiriCommand(),
];

module.exports = commands;
