async function replyText(client, message, text, options = {}) {
  const jid = message?.key?.remoteJid;
  if (!client || typeof client.sendMessage !== 'function' || !jid) {
    return false;
  }

  const sent = await client.sendMessage(
    jid,
    { text },
    {
      quoted: message,
      ...options,
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

  const sent = await client.sendMessage(
    jid,
    {
      ...payload,
      caption,
    },
    {
      quoted: message,
      ...options,
    }
  );

  return sent || true;
}

module.exports = {
  replyText,
  replyImage,
  sendText: replyText,
};
