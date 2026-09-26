const fs = require('fs');
const path = require('path');
const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
const { messages, formatMessage } = require('../../messages');
const config = require('../../config/bot.config');
const { MENU_CATEGORIES, CHANNEL_URL } = require('../../features/menu/menu.data');
const { getCategoryRows, buildCategorySelect, buildCommandSelect } = require('../../features/menu/menu.builder');
const {
  sendNativeFlow,
  createNativeFlowButton,
  getNativeFlowResponseId,
  getInteractiveAdditionalNodes,
} = require('../../utils/interactive');
const { sendTyping } = require('../../utils/message.utils');
const { sendMenuAudio } = require('../../features/menu/menu.audio');

function getRandomBannerVideo() {
  const bannerDir = path.resolve(__dirname, '../../../assets/banner');
  if (fs.existsSync(bannerDir)) {
    const entries = fs.readdirSync(bannerDir).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return ['.mp4', '.mkv', '.mov', '.webm'].includes(ext);
    });

    if (entries.length > 0) {
      const choice = entries[Math.floor(Math.random() * entries.length)];
      return path.join(bannerDir, choice);
    }
  }

  const fallback = path.resolve(__dirname, '../../../assets/animation-gagak.mp4');
  return fs.existsSync(fallback) ? fallback : null;
}

async function sendMainMenu(client, message) {
  const jid = message?.key?.remoteJid;
  if (!jid) throw new Error('remoteJid tidak ditemukan.');

  await sendTyping(client, jid, 'composing');

  const videoPath = getRandomBannerVideo();
  if (!videoPath) throw new Error('File video banner tidak ditemukan.');

  const videoBuffer = fs.readFileSync(videoPath);
  const media = await prepareWAMessageMedia(
    { video: videoBuffer, mimetype: 'video/mp4', gifPlayback: true },
    { upload: client.waUploadToServer }
  );

  if (!media?.videoMessage) throw new Error('Gagal membuat videoMessage.');

  const displayName = message?.pushName || message?.key?.participant || 'Master';
  const ownerName = config?.ownerName || 'Tuan';

  const mainMenuBody = formatMessage(messages.menu.main.body, {
    name: displayName,
    ownerName,
    prefix: config.prefix || '.',
  });

  const categoryButton = createNativeFlowButton('single_select', {
    title: messages.menu.main.selectCategory,
    sections: buildCategorySelect(),
  });

  const channelButton = createNativeFlowButton('cta_url', {
    display_text: messages.menu.main.channelButton,
    url: CHANNEL_URL,
    merchant_url: CHANNEL_URL,
  });

  await sendNativeFlow(client, jid, message, {
    title: messages.menu.main.title || 'ALBEDO',
    body: mainMenuBody,
    footer: messages.menu.main.footer,
    buttons: [channelButton, categoryButton],
    headerMedia: { videoMessage: media.videoMessage },
  });

  return true;
}

async function sendCategoryMenu(client, message, categoryKey) {
  const jid = message?.key?.remoteJid;
  if (!jid) return false;

  const category = MENU_CATEGORIES[categoryKey];
  if (!category) {
    console.warn(`[MENU] Category tidak ditemukan: ${categoryKey}`);
    return false;
  }

  const sections = buildCommandSelect(categoryKey);

  await sendNativeFlow(client, jid, message, {
    title: messages.menu.category.title,
    body: formatMessage(messages.menu.category.body, { categoryTitle: category.title }),
    sections,
    channel: true,
  });

  return true;
}

async function handleConverterCategory(client, message) {
  const jid = message?.key?.remoteJid;
  if (!jid) return false;

  const stickerText = formatMessage(messages.menu.converter.body || '', {});
  return sendNativeFlow(client, jid, message, {
    title: messages.menu.main.selectCategory || 'LIST MENU',
    body: stickerText,
    sections: buildCategorySelect(),
  });
}

async function handleMenuSelection(client, message) {
  const content = message?.message;
  if (!content) return false;

  const selectedId = getNativeFlowResponseId(content);
  if (!selectedId) return false;

  if (selectedId.startsWith('category:')) {
    const categoryKey = selectedId.substring('category:'.length);
    if (!MENU_CATEGORIES[categoryKey]) {
      console.warn(`[MENU] Unknown category: ${categoryKey}`);
      return false;
    }

    if (categoryKey === 'converter') {
      return !!(await handleConverterCategory(client, message));
    }

    await sendCategoryMenu(client, message, categoryKey);
    return true;
  }

  if (selectedId.includes(':')) {
    const [, commandKey] = selectedId.split(':');
    if (commandKey === 'sticker') {
      return !!(await handleConverterCategory(client, message));
    }

    await client.sendMessage(message.key.remoteJid, { text: `.${commandKey}` });
    return true;
  }

  return false;
}

module.exports = {
  name: 'menu',
  aliases: ['help', 'start'],
  description: 'Tampilkan menu bot dengan video dan tombol interaktif.',
  MENU_CATEGORIES,
  getCategoryRows,
  buildCategorySelect,
  buildCommandSelect,
  getNativeFlowResponseId,
  sendNativeFlow,
  sendMainMenu,
  sendCategoryMenu,
  sendSection1: sendMainMenu,
  sendSection2: sendCategoryMenu,
  sendMenuAudio,
  handleConverterCategory,
  handleMenuSelection,
  execute: async (client, message) => {
    try {
      const res = await sendMainMenu(client, message);
      try {
        await sendMenuAudio(client, message);
      } catch (audioErr) {
        console.warn('[MENU] Audio voice note error:', audioErr?.message || audioErr);
      }
      return res;
    } catch (error) {
      console.error('[MENU] Error:', error);
      const jid = message?.key?.remoteJid;
      if (jid) {
        await client.sendMessage(jid, { text: messages.menu.main.fallback }, { quoted: message });
      }
      return false;
    }
  },
};
