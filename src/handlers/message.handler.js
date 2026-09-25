const { messages } = require('../messages');
const { replyText } = require('../core/reply');
const { parseCommand, sendTyping, getMessageText, getSenderJid } = require('../utils/message.utils');
const { getNativeFlowResponseId, sendMainMenu, sendCategoryMenu } = require('../commands/general/menu');
const { handleCommand } = require('./command.handler');
const { getSession } = require('../features/games/game.state');
const { buyLimit } = require('../features/limit/limit.service');

async function handleGameMessage(client, message) {
  const jid = message?.key?.remoteJid;
  if (!jid) return false;

  const session = getSession(jid);
  if (!session) return false;

  const senderJid = getSenderJid(message);
  const text = getMessageText(message).trim();
  if (!text) return false;

  if (typeof session.onAnswer === 'function') {
    return await session.onAnswer(senderJid, text);
  }

  if (session.type === 'tictactoe' && typeof session.onMove === 'function') {
    return await session.onMove(senderJid, text);
  }

  if (session.type === 'suit' && typeof session.onChoice === 'function') {
    const clean = text.replace(/^\.pilih\s+/i, '').trim().toLowerCase();
    return await session.onChoice(senderJid, clean);
  }

  return false;
}

async function handleInteractiveMessage(client, message, commandMap) {
  const content = message?.message;
  if (!content) return false;

  const selectedId = getNativeFlowResponseId(content);
  if (!selectedId) return false;

  const jid = message?.key?.remoteJid;
  if (!jid) return false;

  console.log(`[MESSAGE] Interactive selected ID: ${selectedId}`);
  await sendTyping(client, jid, 'composing');

  try {
    if (selectedId === 'menu:open') {
      await sendMainMenu(client, message);
      return true;
    }

    // Handle Limit Store Purchases
    if (selectedId.startsWith('store:buy_')) {
      const amount = parseInt(selectedId.replace('store:buy_', ''), 10) || 10;
      const sender = getSenderJid(message);
      const buyRes = await buyLimit(sender, amount);

      if (!buyRes.success) {
        if (buyRes.reason === 'unregistered') {
          await replyText(client, message, messages.profile.register.required);
          return true;
        }

        await replyText(
          client,
          message,
          messages.store.insufficientExp({
            price: buyRes.price,
            currentExp: buyRes.currentExp,
            missingExp: buyRes.missingExp,
          })
        );
        return true;
      }

      await replyText(
        client,
        message,
        messages.store.buySuccess({
          amount: buyRes.amount,
          price: buyRes.price,
          newLimit: buyRes.newLimit,
          remainingExp: buyRes.remainingExp,
        })
      );
      return true;
    }

    if (selectedId === 'menu_utama:store' || selectedId === 'store:open') {
      const storeCmd = commandMap?.get('store');
      if (storeCmd) {
        await handleCommand(client, message, storeCmd, []);
      }
      return true;
    }

    const cleanId = selectedId.replace(/^\.+/, '').trim().toLowerCase();

    if (cleanId === 'editprofile' || selectedId === 'profile:editprofile') {
      const editProfileCmd = commandMap?.get('editprofile');
      if (editProfileCmd) {
        await handleCommand(client, message, editProfileCmd, []);
      }
      return true;
    }

    if (commandMap?.has(cleanId)) {
      const command = commandMap.get(cleanId);
      await handleCommand(client, message, command, []);
      return true;
    }

    if (selectedId.startsWith('category:')) {
      const categoryKey = selectedId.substring('category:'.length);
      if (!categoryKey) {
        console.warn('[MESSAGE] Category key kosong.');
        return true;
      }

      await sendCategoryMenu(client, message, categoryKey);
      return true;
    }

    if (selectedId.includes(':')) {
      const [categoryKey, commandName] = selectedId.split(':');
      if (!categoryKey || !commandName) {
        console.warn('[MESSAGE] Invalid interactive command ID:', selectedId);
        return true;
      }

      const command = commandMap?.get(commandName);
      if (!command) {
        console.warn(`[MESSAGE] Command not found: ${commandName}`);
        await replyText(client, message, messages.bot.commandNotFound(commandName));
        return true;
      }

      await handleCommand(client, message, command, []);
      return true;
    }

    return true;
  } finally {
    await sendTyping(client, jid, 'paused');
  }
}

async function handleMessage(client, message, commandMap) {
  try {
    if (!message?.message) return false;

    const interactiveHandled = await handleInteractiveMessage(client, message, commandMap);
    if (interactiveHandled) return true;

    // Check if active game session intercepts this message
    const gameHandled = await handleGameMessage(client, message);
    if (gameHandled) return true;

    // Fallback for button plain text responses (e.g. "EDIT PROFILE")
    const rawText = getMessageText(message).trim().toLowerCase();
    if (rawText === 'edit profile' || rawText === 'editprofile') {
      const editProfileCmd = commandMap?.get('editprofile');
      if (editProfileCmd) {
        const jid = message?.key?.remoteJid;
        await sendTyping(client, jid, 'composing');
        try {
          await handleCommand(client, message, editProfileCmd, []);
        } finally {
          await sendTyping(client, jid, 'paused');
        }
        return true;
      }
    }

    const parsed = parseCommand(message);
    if (!parsed || !parsed.isCommand) return false;

    const { command, args } = parsed;
    const commandItem = commandMap?.get(command);
    if (!commandItem) return false;

    const jid = message?.key?.remoteJid;
    await sendTyping(client, jid, 'composing');

    try {
      await handleCommand(client, message, commandItem, args);
    } finally {
      await sendTyping(client, jid, 'paused');
    }

    return true;
  } catch (error) {
    console.error('[MESSAGE] Handler error:', error);
    return false;
  }
}

module.exports = {
  handleMessage,
};
