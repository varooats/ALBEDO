const fs = require('fs/promises');
const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { getUserByJid, findUserByQuery } = require('../../database/repositories/user.repository');
const { messages } = require('../../messages');
const { resolveJid, resolveMentionJids, sendReaction, REACTIONS } = require('../../utils/message.utils');
const { sendNativeFlow, createNativeFlowButton } = require('../../utils/interactive');
const { buildCategorySelect } = require('../../features/menu/menu.builder');
const {
  getProfilePictureDataUri,
  getGroupTitle,
  generateProfileImage,
  createTempImageFile,
  removeTempFile,
} = require('../../features/profile/profile.card');

module.exports = createCommand({
  name: 'profile',
  aliases: ['prof', 'idcard', 'id'],
  description: 'Tampilkan Student Identity Card.',
  execute: async (client, message, args = []) => {
    const selfJid = resolveJid(message);
    if (!selfJid) return false;

    let tempImagePath = null;

    try {
      const mentionedJids = resolveMentionJids(message);
      const query = (args || []).join(' ').trim();
      const targetJid = mentionedJids[0] || null;

      let selectedUser;
      if (targetJid) {
        selectedUser = await getUserByJid(targetJid);
      } else if (query) {
        selectedUser = await findUserByQuery(query);
      } else {
        selectedUser = await getUserByJid(selfJid);
      }

      if (!selectedUser) {
        await replyText(client, message, messages.profile.notFound);
        return true;
      }

      const groupTitle = await getGroupTitle(client, message);
      const avatarDataUri = selectedUser.jid
        ? await getProfilePictureDataUri(client, selectedUser.jid)
        : null;

      const imageBuffer = await generateProfileImage(selectedUser, avatarDataUri, groupTitle);
      tempImagePath = await createTempImageFile(imageBuffer);
      await sendReaction(client, message, REACTIONS.PROCESSING);

      const caption = messages.profile.cardCaption(selectedUser);
      const jid = message.key.remoteJid;

      try {
        const fileBuf = await fs.readFile(tempImagePath);
        const media = await prepareWAMessageMedia(
          { image: fileBuf, mimetype: 'image/png' },
          { upload: client.waUploadToServer }
        );

        const editButton = createNativeFlowButton('quick_reply', {
          display_text: 'EDIT PROFILE',
          id: '.editprofile',
        });

        const selectButton = createNativeFlowButton('single_select', {
          title: 'LIST MENU',
          sections: buildCategorySelect(),
        });

        await sendNativeFlow(client, jid, message, {
          title: messages.menu.main.title || 'ALBEDO',
          body: caption,
          buttons: [editButton, selectButton],
          headerMedia: { imageMessage: media.imageMessage },
        });
        await sendReaction(client, message, REACTIONS.SUCCESS);
      } catch (flowError) {
        console.warn('[PROFILE] Interactive card failed, fallback image:', flowError?.message || flowError);
        await client.sendMessage(
          jid,
          {
            image: { url: tempImagePath },
            mimetype: 'image/png',
            caption,
            mentions: selectedUser.jid ? [selectedUser.jid] : [],
          },
          { quoted: message }
        );
        await sendReaction(client, message, REACTIONS.SUCCESS);
      }

      return true;
    } catch (error) {
      console.error('[PROFILE] Error:', error);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, messages.profile.loadError);
      return false;
    } finally {
      if (tempImagePath) {
        await removeTempFile(tempImagePath);
      }
    }
  },
});
