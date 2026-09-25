const { proto, generateWAMessageFromContent, isJidGroup } = require('@whiskeysockets/baileys');
const { messages } = require('../messages');
const { getInfoPayload } = require('../messages/info.messages');
const { replyText } = require('../core/reply');
const { CHANNEL_URL } = require('../features/menu/menu.data');

const DEFAULT_FOOTER = messages.menu.main.footer || 'ALBEDO';

function createNativeFlowButton(name, params) {
  return proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton.create({
    name,
    buttonParamsJson: JSON.stringify(params),
  });
}

function getPrivacyModeTs() {
  const offset = 77980457;
  return (Math.floor(Date.now() / 1000) - offset).toString();
}

function createBizNode() {
  return {
    tag: 'biz',
    attrs: {
      actual_actors: '2',
      host_storage: '2',
      privacy_mode_ts: getPrivacyModeTs(),
    },
    content: [
      {
        tag: 'interactive',
        attrs: { type: 'native_flow', v: '1' },
        content: [
          {
            tag: 'native_flow',
            attrs: { v: '9', name: 'mixed' },
          },
        ],
      },
      {
        tag: 'quality_control',
        attrs: { source_type: 'third_party' },
      },
    ],
  };
}

function getInteractiveAdditionalNodes(jid, isGroupFn = isJidGroup) {
  const bizNode = createBizNode();
  const isGroup = typeof isGroupFn === 'function' ? isGroupFn(jid) : String(jid || '').endsWith('@g.us');

  if (isGroup) {
    return [bizNode];
  }

  return [
    {
      tag: 'bot',
      attrs: { biz_bot: '1' },
    },
    bizNode,
  ];
}

function getNativeFlowResponseId(message) {
  const nativeFlow = message?.interactiveResponseMessage?.nativeFlowResponseMessage;

  if (nativeFlow?.paramsJson) {
    try {
      const params = JSON.parse(nativeFlow.paramsJson);
      if (typeof params?.id === 'string') return params.id;
      if (typeof params?.selectedId === 'string') return params.selectedId;
      if (typeof params?.selectedRowId === 'string') return params.selectedRowId;
    } catch (error) {
      console.warn('[INTERACTIVE] Gagal parse paramsJson:', error?.message || error);
    }
  }

  const selectedRowId = message?.listResponseMessage?.singleSelectReply?.selectedRowId;
  if (typeof selectedRowId === 'string') return selectedRowId;

  const buttonId = message?.buttonsResponseMessage?.selectedButtonId;
  if (typeof buttonId === 'string') return buttonId;

  return null;
}

async function sendNativeFlow(
  client,
  jid,
  quotedMessage,
  {
    title = '',
    body = '',
    footer = DEFAULT_FOOTER,
    sections = [],
    buttons = [],
    channel = false,
    headerMedia = null,
  } = {}
) {
  const finalButtons = [...buttons];

  if (channel) {
    finalButtons.push(
      createNativeFlowButton('cta_url', {
        display_text: messages.menu.main.channelButton || 'CREATOR',
        url: CHANNEL_URL,
        merchant_url: CHANNEL_URL,
      })
    );
  }

  if (sections && sections.length > 0 && !buttons.some((b) => b.name === 'single_select')) {
    finalButtons.push(
      createNativeFlowButton('single_select', {
        title: title || 'LIST MENU',
        sections,
      })
    );
  }

  const interactiveMessageObj = {
    body: proto.Message.InteractiveMessage.Body.create({ text: body }),
    footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons: finalButtons,
      messageParamsJson: '{}',
      messageVersion: 1,
    }),
  };

  if (headerMedia) {
    interactiveMessageObj.header = proto.Message.InteractiveMessage.Header.create({
      title: title || 'ALBEDO',
      hasMediaAttachment: true,
      ...headerMedia,
    });
  }

  const interactiveMessage = proto.Message.InteractiveMessage.create(interactiveMessageObj);
  const userJid = client?.user?.id || jid;

  const generatedMessage = generateWAMessageFromContent(
    jid,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage,
        },
      },
    },
    {
      userJid,
      quoted: quotedMessage,
    }
  );

  const messageId = generatedMessage?.key?.id;
  if (!messageId) {
    throw new Error('Message ID tidak ditemukan saat generate interactive message.');
  }

  await client.relayMessage(jid, generatedMessage.message, {
    messageId,
    additionalNodes: getInteractiveAdditionalNodes(jid, isJidGroup),
  });

  return true;
}

async function sendInfoReply(client, message, keyOrPayload, context = {}) {
  const payload = typeof keyOrPayload === 'string'
    ? getInfoPayload(keyOrPayload, context)
    : keyOrPayload;

  const jid = message?.key?.remoteJid;

  if (client && jid && Array.isArray(payload.sections) && payload.sections.length > 0) {
    try {
      await sendNativeFlow(client, jid, message, {
        title: payload.title,
        body: payload.body,
        sections: payload.sections,
        channel: true,
      });
      return true;
    } catch (err) {
      console.warn('[INTERACTIVE] sendNativeFlow failed, fallback to text:', err?.message || err);
    }
  }

  await replyText(client, message, payload.body);
  return true;
}

module.exports = {
  createNativeFlowButton,
  getPrivacyModeTs,
  createBizNode,
  getInteractiveAdditionalNodes,
  getNativeFlowResponseId,
  sendNativeFlow,
  sendInfoReply,
};
