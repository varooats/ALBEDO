function getMessageText(input = {}) {
  const candidates = [
    input?.body,
    input?.text,
    input?.message?.conversation,
    input?.message?.extendedTextMessage?.text,
    input?.message?.imageMessage?.caption,
    input?.message?.videoMessage?.caption,
    input?.message?.documentMessage?.caption,
    input?.message?.audioMessage?.caption,
  ];

  const text = candidates.find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );

  return text ? text.trim() : '';
}

function parseCommand(input = {}) {
  const rawText = getMessageText(input);

  if (!rawText) {
    return { isCommand: false, text: '', command: null, args: [] };
  }

  const startsWithDot = rawText.startsWith('.');
  const startsWithBang = rawText.startsWith('!');

  if ((!startsWithDot && !startsWithBang) || rawText.length <= 1) {
    return { isCommand: false, text: rawText, command: null, args: [] };
  }

  const [command, ...args] = rawText.slice(1).trim().split(/\s+/);

  return {
    isCommand: true,
    text: rawText,
    command: (command || '').toLowerCase(),
    args,
  };
}

function resolveJid(message) {
  if (!message?.key) return null;
  const participant = message.key.participant;
  if (participant && participant !== message.key.remoteJid) {
    return participant;
  }
  return message.key.remoteJid || null;
}

function resolveMentionJids(message = {}) {
  const content = message?.message || {};
  const extended = content.extendedTextMessage || {};
  const contextInfo = extended.contextInfo || {};
  const mentioned = contextInfo.mentionedJid || [];

  if (Array.isArray(mentioned) && mentioned.length > 0) {
    return mentioned;
  }
  if (typeof mentioned === 'string' && mentioned.trim()) {
    return [mentioned];
  }
  return [];
}

function getSenderJid(message) {
  return (
    message?.key?.participant ||
    message?.participant ||
    message?.key?.remoteJid ||
    null
  );
}

function jidToMentionName(jid) {
  if (!jid) return '';
  return `@${String(jid).split('@')[0]}`;
}

function formatCurrency(value) {
  try {
    return new Intl.NumberFormat('id-ID').format(value);
  } catch {
    return String(value);
  }
}

async function sendTyping(client, jid, state = 'composing') {
  if (!client || typeof client.sendPresenceUpdate !== 'function' || !jid) {
    return;
  }
  try {
    await client.sendPresenceUpdate(state, jid);
  } catch (error) {
    console.warn(`[MESSAGE] Presence ${state} error:`, error?.message || error);
  }
}

const REACTIONS = {
  SEARCHING: '🔍',
  PROCESSING: '⏳',
  SUCCESS: '✅',
  FAILED: '❌',
  CLEAR: '',
};

async function sendReaction(client, message, emoji = '⏳') {
  const jid = message?.key?.remoteJid;
  if (!client || typeof client.sendMessage !== 'function' || !jid || !message?.key) {
    return false;
  }
  try {
    await client.sendMessage(jid, {
      react: {
        text: emoji,
        key: message.key,
      },
    });
    return true;
  } catch (error) {
    console.warn(`[MESSAGE] Reaction error (${emoji}):`, error?.message || error);
    return false;
  }
}

module.exports = {
  REACTIONS,
  sendReaction,
  getMessageText,
  parseCommand,
  resolveJid,
  resolveMentionJids,
  getSenderJid,
  jidToMentionName,
  formatCurrency,
  sendTyping,
};
