const { getProfilePictureDataUri } = require('../profile/profile.card');
const { generateWelcomeCard } = require('./welcome.card');
const { welcomeMessages } = require('../../messages/welcome.messages');
const { jidToMentionName } = require('../../utils/message.utils');
const { getUserByJid } = require('../../database/repositories/user.repository');

/**
 * Handle group-participants.update event from Baileys
 * Event payload: { id: groupJid, participants: [userJids], action: 'add' | 'remove' }
 */
async function handleGroupParticipantsUpdate(client, update) {
  const { id: groupJid, participants, action } = update || {};

  if (!groupJid || !Array.isArray(participants) || participants.length === 0) {
    return false;
  }

  // Only handle 'add' (join) and 'remove' (leave/kick)
  if (action !== 'add' && action !== 'remove') {
    return false;
  }

  const isWelcome = action === 'add';

  // 1. Fetch group metadata
  let groupMetadata = null;
  try {
    groupMetadata = await client.groupMetadata(groupJid);
  } catch (err) {
    console.warn('[WELCOME] Failed to fetch group metadata:', err?.message || err);
  }

  const groupName = groupMetadata?.subject || groupMetadata?.name || 'Grup';
  const memberCount = groupMetadata?.participants?.length || null;

  for (const userJid of participants) {
    // Avoid sending messages to bot's own JID or empty
    if (!userJid) continue;

    try {
      // 2. Fetch user details
      const registeredUser = await getUserByJid(userJid);
      const cardName = registeredUser?.name || userJid.split('@')[0] || 'Pengembara';
      // Clickable tag mention format for WhatsApp
      const tagMention = jidToMentionName(userJid);

      let avatarDataUri = null;
      try {
        avatarDataUri = await getProfilePictureDataUri(client, userJid);
      } catch (e) {
        console.warn('[WELCOME] Could not load avatar:', e?.message || e);
      }

      // 3. Generate landscape image card (uses clean display name on the graphic)
      let imageBuffer = null;
      try {
        imageBuffer = await generateWelcomeCard({
          type: isWelcome ? 'welcome' : 'goodbye',
          name: cardName,
          groupName,
          avatarDataUri,
          memberCount,
        });
      } catch (renderErr) {
        console.error('[WELCOME] Failed to render card:', renderErr);
      }

      // 4. Build text caption with clickable tag mention
      const caption = isWelcome
        ? welcomeMessages.welcomeCaption({
            name: tagMention,
            groupName,
            memberCount,
          })
        : welcomeMessages.goodbyeCaption({
            name: tagMention,
            groupName,
            memberCount,
          });

      // 5. Send message with image card and clickable mentions array
      if (imageBuffer) {
        try {
          await client.sendMessage(
            groupJid,
            {
              image: imageBuffer,
              caption,
              mentions: [userJid],
            }
          );
          continue;
        } catch (sendImgErr) {
          console.warn('[WELCOME] Image send failed, falling back to text:', sendImgErr?.message || sendImgErr);
        }
      }

      // Fallback: send text message with clickable mention
      await client.sendMessage(
        groupJid,
        {
          text: caption,
          mentions: [userJid],
        }
      );
    } catch (participantErr) {
      console.error(`[WELCOME] Error handling participant ${userJid}:`, participantErr);
    }
  }

  return true;
}

module.exports = {
  handleGroupParticipantsUpdate,
};
