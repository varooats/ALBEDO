const { createCommand } = require('../../core/command.factory');
const { replyText, replyImage } = require('../../core/reply');
const {
  resolveJid,
  resolveMentionJids,
  jidToMentionName,
  sendReaction,
  REACTIONS,
} = require('../../utils/message.utils');
const {
  drawCard,
  drawMultipleCards,
  getThematicReading,
  evaluateYesNo,
  processDailyTarot,
} = require('../../features/tarot/tarot.service');
const {
  formatTarotMenu,
  formatSingleCard,
  formatThreeCardReading,
  formatDailyTarot,
  formatDailyCooldown,
  formatYesNo,
} = require('../../features/tarot/tarot.formatter');
const { generateTarotCompositeImage } = require('../../features/tarot/tarot.renderer');
const { sendNativeFlow } = require('../../utils/interactive');
const { getMainMenuSection, getFiturBotSection } = require('../../features/menu/menu.builder');

/**
 * Determine target JID and whether it should be mentioned
 */
function resolveTarget(message) {
  const sender = resolveJid(message);
  const mentions = resolveMentionJids(message);

  if (mentions.length > 0 && mentions[0] !== sender) {
    const targetJid = mentions[0];
    return {
      jid: targetJid,
      mentionName: jidToMentionName(targetJid),
      isSelf: false,
    };
  }

  return {
    jid: sender,
    mentionName: null,
    isSelf: true,
  };
}

/**
 * Safe helper to reply with Tarot Composite Card Image + Caption
 */
async function replyTarotCard(client, message, { imageBuffer, caption, mentions = [] }) {
  const options = mentions && mentions.length > 0 ? { mentions } : {};
  if (imageBuffer) {
    try {
      await replyImage(client, message, imageBuffer, caption, options);
      return true;
    } catch (imgErr) {
      console.warn('[TAROT] Image send failed, falling back to text:', imgErr?.message || imgErr);
    }
  }

  await replyText(client, message, caption, options);
  return true;
}

// 1. Menu Utama Tarot & Penjelas: .tarot (Free)
const tarotMenuCommand = createCommand({
  name: 'tarot',
  aliases: ['tarotmenu', 'tarothelp', 'menutarot'],
  description: 'Buka bilik ramalan Tarot dan daftar ritual ramalan.',
  isFree: true,
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const bodyText = formatTarotMenu();

    const sections = [
      {
        title: 'RITUAL RAMALAN TAROT',
        rows: [
          { id: '.ramal', title: '.ramal', description: 'Ramal 1 kartu bimbingan jiwa (1 Limit)' },
          { id: '.ramalhidup', title: '.ramalhidup', description: 'Ramal 3 fase perjalanan hidup (3 Limit)' },
          { id: '.ramalhariini', title: '.ramalhariini', description: 'Ramal kartu bimbingan harian (1 Limit)' },
          { id: '.ramalcinta', title: '.ramalcinta', description: 'Ramal asmara, hati & koneksi (2 Limit)' },
          { id: '.ramalkarir', title: '.ramalkarir', description: 'Ramal karier, ambisi & kerja (2 Limit)' },
          { id: '.ramalkeuangan', title: '.ramalkeuangan', description: 'Ramal keuangan & rezeki (2 Limit)' },
          { id: '.ramaltanya', title: '.ramaltanya', description: 'Ramal jawaban batin Yes/No (1 Limit)' },
        ],
      },
    ];

    const mainMenuSection = getMainMenuSection();
    if (mainMenuSection) sections.push(mainMenuSection);

    const fiturBotSection = getFiturBotSection();
    if (fiturBotSection) sections.push(fiturBotSection);

    try {
      await sendNativeFlow(client, jid, message, {
        title: 'TAROT & DIVINATION',
        body: bodyText,
        sections,
      });
      return true;
    } catch (flowErr) {
      console.warn('[TAROT] Native flow menu failed, fallback to text:', flowErr?.message || flowErr);
      await replyText(client, message, bodyText);
      return true;
    }
  },
});

// 2. Ramal 1 Kartu: .ramal [@user] (1 Limit)
const ramalCommand = createCommand({
  name: 'ramal',
  aliases: ['bacatarot', 'ramalkartu'],
  description: 'Ramal 1 kartu Tarot bimbingan jiwa untukmu atau orang lain.',
  limitCost: 1,
  execute: async (client, message, args = []) => {
    try {
      await sendReaction(client, message, REACTIONS.PROCESSING);
      const target = resolveTarget(message);
      const card = drawCard();

      const text = formatSingleCard({
        targetMention: target.mentionName,
        card,
        theme: 'general',
      });

      const imgBuf = await generateTarotCompositeImage([card], {
        title: 'DIVINATION ORACLE',
        label: 'DESTINY',
      }).catch((e) => {
        console.warn('[TAROT] Card rendering error:', e?.message || e);
        return null;
      });

      const mentions = target.isSelf ? [] : [target.jid];
      await replyTarotCard(client, message, {
        imageBuffer: imgBuf,
        caption: text,
        mentions,
      });

      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (err) {
      console.error('[TAROT] Error in .ramal:', err);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, 'Maaf, terjadi kendala saat meramal kartu Tarot. Silakan coba lagi.');
      return false;
    }
  },
});

// 3. Ramalan 3 Fase Hidup: .ramalhidup [@user] (3 Limit - 3 Kartu Mendalam)
const ramalHidupCommand = createCommand({
  name: 'ramalhidup',
  aliases: ['tarot3', 'ramal3', 'perjalananhidup'],
  description: 'Ramal 3 fase kehidupan: Masa Lalu, Masa Kini, dan Refleksi Masa Depan.',
  limitCost: 3,
  execute: async (client, message, args = []) => {
    try {
      await sendReaction(client, message, REACTIONS.PROCESSING);
      const target = resolveTarget(message);
      const cards = drawMultipleCards(3);

      const text = formatThreeCardReading({
        targetMention: target.mentionName,
        cards,
      });

      const imgBuf = await generateTarotCompositeImage(cards, {
        title: 'LIFE PATH DIVINATION',
        labels: ['MASA LALU', 'MASA KINI', 'MASA DEPAN'],
      }).catch((e) => {
        console.warn('[TAROT] Card rendering error:', e?.message || e);
        return null;
      });

      const mentions = target.isSelf ? [] : [target.jid];
      await replyTarotCard(client, message, {
        imageBuffer: imgBuf,
        caption: text,
        mentions,
      });

      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (err) {
      console.error('[TAROT] Error in .ramalhidup:', err);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, 'Maaf, terjadi kendala saat meramal 3 fase kehidupan.');
      return false;
    }
  },
});

// 4. Ramalan Kartu Hari Ini: .ramalhariini (1 Limit)
const ramalHariIniCommand = createCommand({
  name: 'ramalhariini',
  aliases: ['tarottoday', 'tarotdaily', 'kartuhariini'],
  description: 'Ramal kartu bimbingan harian untuk membuka harimu (1x sehari).',
  limitCost: 1,
  execute: async (client, message, args = []) => {
    const sender = resolveJid(message);
    if (!sender) return false;

    try {
      await sendReaction(client, message, REACTIONS.PROCESSING);
      const res = await processDailyTarot(sender);

      if (!res.success) {
        await sendReaction(client, message, REACTIONS.CLEAR);
        if (res.reason === 'cooldown') {
          const cdText = formatDailyCooldown({ hoursLeft: res.hoursLeft });
          await replyText(client, message, cdText);
          return true;
        }
        await replyText(client, message, 'Gagal memproses Ramalan Harian. Pastikan kamu sudah terdaftar.');
        return false;
      }

      const text = formatDailyTarot({ card: res.card });
      const imgBuf = await generateTarotCompositeImage([res.card], {
        title: 'DAILY GUIDANCE',
        label: 'TODAY',
      }).catch((e) => {
        console.warn('[TAROT] Card rendering error:', e?.message || e);
        return null;
      });

      await replyTarotCard(client, message, {
        imageBuffer: imgBuf,
        caption: text,
      });

      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (err) {
      console.error('[TAROT] Error in .ramalhariini:', err);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, 'Maaf, terjadi kendala saat meramal kartu harian.');
      return false;
    }
  },
});

// 5. Ramalan Cinta: .ramalcinta [@user] (2 Limit - Tematik Mendalam)
const ramalCintaCommand = createCommand({
  name: 'ramalcinta',
  aliases: ['tarotlove', 'ramaljodoh', 'ramalasmara'],
  description: 'Ramalan kartu seputar dinamika asmara, rasa, dan hubungan batin.',
  limitCost: 2,
  execute: async (client, message, args = []) => {
    try {
      await sendReaction(client, message, REACTIONS.PROCESSING);
      const target = resolveTarget(message);
      const rawCard = drawCard();
      const thematic = getThematicReading(rawCard, 'love');

      const card = {
        ...rawCard,
        meaning: thematic.reading,
        reflection: thematic.reflection,
      };

      const text = formatSingleCard({
        targetMention: target.mentionName,
        card,
        theme: 'love',
      });

      const imgBuf = await generateTarotCompositeImage([card], {
        title: 'LOVE & AFFECTION',
        label: 'HEART',
      }).catch((e) => {
        console.warn('[TAROT] Card rendering error:', e?.message || e);
        return null;
      });

      const mentions = target.isSelf ? [] : [target.jid];
      await replyTarotCard(client, message, {
        imageBuffer: imgBuf,
        caption: text,
        mentions,
      });

      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (err) {
      console.error('[TAROT] Error in .ramalcinta:', err);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, 'Maaf, terjadi kendala saat membaca ramalan asmara.');
      return false;
    }
  },
});

// 6. Ramalan Karier: .ramalkarir [@user] (2 Limit - Tematik Mendalam)
const ramalKarirCommand = createCommand({
  name: 'ramalkarir',
  aliases: ['tarotcareer', 'ramalkerja', 'ramalbisnis'],
  description: 'Ramalan kartu seputar pekerjaan, ambisi, dan langkah karier.',
  limitCost: 2,
  execute: async (client, message, args = []) => {
    try {
      await sendReaction(client, message, REACTIONS.PROCESSING);
      const target = resolveTarget(message);
      const rawCard = drawCard();
      const thematic = getThematicReading(rawCard, 'career');

      const card = {
        ...rawCard,
        meaning: thematic.reading,
        reflection: thematic.reflection,
      };

      const text = formatSingleCard({
        targetMention: target.mentionName,
        card,
        theme: 'career',
      });

      const imgBuf = await generateTarotCompositeImage([card], {
        title: 'CAREER & AMBITION',
        label: 'SUCCESS',
      }).catch((e) => {
        console.warn('[TAROT] Card rendering error:', e?.message || e);
        return null;
      });

      const mentions = target.isSelf ? [] : [target.jid];
      await replyTarotCard(client, message, {
        imageBuffer: imgBuf,
        caption: text,
        mentions,
      });

      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (err) {
      console.error('[TAROT] Error in .ramalkarir:', err);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, 'Maaf, terjadi kendala saat membaca ramalan karier.');
      return false;
    }
  },
});

// 7. Ramalan Keuangan: .ramalkeuangan [@user] (2 Limit - Tematik Mendalam)
const ramalKeuanganCommand = createCommand({
  name: 'ramalkeuangan',
  aliases: ['tarotmoney', 'ramalrezeki', 'ramaluang'],
  description: 'Ramalan kartu seputar keuangan, kebiasaan materi, dan rezeki.',
  limitCost: 2,
  execute: async (client, message, args = []) => {
    try {
      await sendReaction(client, message, REACTIONS.PROCESSING);
      const target = resolveTarget(message);
      const rawCard = drawCard();
      const thematic = getThematicReading(rawCard, 'money');

      const card = {
        ...rawCard,
        meaning: thematic.reading,
        reflection: thematic.reflection,
      };

      const text = formatSingleCard({
        targetMention: target.mentionName,
        card,
        theme: 'money',
      });

      const imgBuf = await generateTarotCompositeImage([card], {
        title: 'WEALTH & FORTUNE',
        label: 'FORTUNE',
      }).catch((e) => {
        console.warn('[TAROT] Card rendering error:', e?.message || e);
        return null;
      });

      const mentions = target.isSelf ? [] : [target.jid];
      await replyTarotCard(client, message, {
        imageBuffer: imgBuf,
        caption: text,
        mentions,
      });

      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (err) {
      console.error('[TAROT] Error in .ramalkeuangan:', err);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, 'Maaf, terjadi kendala saat membaca ramalan keuangan.');
      return false;
    }
  },
});

// 8. Ramalan Tanya Oracle: .ramaltanya <pertanyaan> (1 Limit)
const ramalTanyaCommand = createCommand({
  name: 'ramaltanya',
  aliases: ['tarotyesno', 'tanyatarot', 'tanyaoracle'],
  description: 'Tanyakan keraguanmu untuk mendapatkan bimbingan arah dari Oracle.',
  limitCost: 1,
  execute: async (client, message, args = []) => {
    const question = args.join(' ').trim();
    if (!question) {
      await replyText(
        client,
        message,
        'Format: ```.ramaltanya <pertanyaan>```\nContoh: ```.ramaltanya apakah langkah yang saya ambil saat ini sudah tepat?```'
      );
      return true;
    }

    try {
      await sendReaction(client, message, REACTIONS.PROCESSING);
      const rawCard = drawCard();
      const evaluation = evaluateYesNo(rawCard);

      const text = formatYesNo({
        question,
        card: evaluation.card,
        result: evaluation.result,
      });

      const imgBuf = await generateTarotCompositeImage([evaluation.card], {
        title: 'ORACLE GUIDANCE',
        label: evaluation.result,
      }).catch((e) => {
        console.warn('[TAROT] Card rendering error:', e?.message || e);
        return null;
      });

      await replyTarotCard(client, message, {
        imageBuffer: imgBuf,
        caption: text,
      });

      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (err) {
      console.error('[TAROT] Error in .ramaltanya:', err);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, 'Maaf, terjadi kendala saat memproses ramalan pertanyaan.');
      return false;
    }
  },
});

module.exports = [
  tarotMenuCommand,
  ramalCommand,
  ramalHidupCommand,
  ramalHariIniCommand,
  ramalCintaCommand,
  ramalKarirCommand,
  ramalKeuanganCommand,
  ramalTanyaCommand,
];
