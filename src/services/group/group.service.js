class GroupService {
  static async getMetadata(client, groupJid) {
    if (!client || typeof client.groupMetadata !== 'function') {
      throw new Error('Client Baileys tidak valid.');
    }
    return client.groupMetadata(groupJid);
  }

  static async kick(client, groupJid, participants) {
    const list = Array.isArray(participants) ? participants : [participants];
    return client.groupParticipantsUpdate(groupJid, list, 'remove');
  }

  static async promote(client, groupJid, participants) {
    const list = Array.isArray(participants) ? participants : [participants];
    return client.groupParticipantsUpdate(groupJid, list, 'promote');
  }

  static async demote(client, groupJid, participants) {
    const list = Array.isArray(participants) ? participants : [participants];
    return client.groupParticipantsUpdate(groupJid, list, 'demote');
  }

  static async openGroup(client, groupJid) {
    return client.groupSettingUpdate(groupJid, 'not_announcement');
  }

  static async closeGroup(client, groupJid) {
    return client.groupSettingUpdate(groupJid, 'announcement');
  }

  static async getInviteLink(client, groupJid) {
    const code = await client.groupInviteCode(groupJid);
    return `https://chat.whatsapp.com/${code}`;
  }

  static async pinChat(client, groupJid, durationStr = '24h') {
    // 24h = 86400, 7d = 604800, 30d = 2592000
    const durationMap = {
      '24h': 86400,
      '7d': 7 * 86400,
      '30d': 30 * 86400,
    };
    const seconds = durationMap[durationStr] || 86400;

    if (typeof client.chatModify === 'function') {
      return client.chatModify({ pin: true, pinLength: seconds }, groupJid);
    }
    return true;
  }

  static async unpinChat(client, groupJid) {
    if (typeof client.chatModify === 'function') {
      return client.chatModify({ pin: false }, groupJid);
    }
    return true;
  }
}

module.exports = GroupService;
