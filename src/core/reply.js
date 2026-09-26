function extractMentionsFromText(text = '') {
  const matches = String(text || '').matchAll(/@(\d{5,16})/g);
  const result = [];
  for (const match of matches) {
    result.push(`${match[1]}@s.whatsapp.net`);
  }
  return result;
}

function resolveMentions(explicit = [], text = '') {
  const set = new Set();
  if (Array.isArray(explicit)) {
    for (const jid of explicit) {
      if (jid) set.add(String(jid).trim());
    }
  }
  for (const jid of extractMentionsFromText(text)) {
    set.add(jid);
  }
  return Array.from(set);
}

async function replyText(client, message, text, options = {}) {
  const jid = message?.key?.remoteJid;
  if (!client || typeof client.sendMessage !== 'function' || !jid) {
    return false;
  }

  const { mentions, ...sendOptions } = options;
  const allMentions = resolveMentions(mentions, text);

  const body = { text };
  if (allMentions.length > 0) {
    body.mentions = allMentions;
  }

  const sent = await client.sendMessage(
    jid,
    body,
    {
      quoted: message,
      ...sendOptions,
    }
  );

  return sent || true;
}

async function replyImage(client, message, image, caption = '', options = {}) {
  const jid = message?.key?.remoteJid;
  if (!client || typeof client.sendMessage !== 'function' || !jid) {
    return false;
  }

  const payload = Buffer.isBuffer(image)
    ? { image }
    : typeof image === 'string'
      ? { image: { url: image } }
      : image;

  const { mentions, ...sendOptions } = options;
  const allMentions = resolveMentions(mentions, caption);

  const body = { ...payload, caption };
  if (allMentions.length > 0) {
    body.mentions = allMentions;
  }

  const sent = await client.sendMessage(
    jid,
    body,
    {
      quoted: message,
      ...sendOptions,
    }
  );

  return sent || true;
}

module.exports = {
  replyText,
  replyImage,
  sendText: replyText,
};
