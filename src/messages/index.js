const { formatMessage } = require('./format');
const { botMessages } = require('./bot.messages');
const { menuMessages } = require('./menu.messages');
const { infoContents, getInfoPayload, buildInfoMessage, buildInfoInteractivePayload, buildBorder } = require('./info.messages');
const { profileMessages } = require('./profile.messages');
const { converterMessages } = require('./converter.messages');
const { funMessages } = require('./fun.messages');
const { gamesMessages } = require('./games.messages');
const { storeMessages } = require('./store.messages');
const { downloaderMessages } = require('./downloader.messages');

const messages = {
  bot: botMessages,
  menu: menuMessages,
  info: {
    contents: infoContents,
    getPayload: getInfoPayload,
    buildMessage: buildInfoMessage,
    buildPayload: buildInfoInteractivePayload,
    buildBorder,
  },
  profile: profileMessages,
  converter: converterMessages,
  fun: funMessages,
  games: gamesMessages,
  store: storeMessages,
  downloader: downloaderMessages,
};

module.exports = {
  messages,
  formatMessage,
  botMessages,
  menuMessages,
  profileMessages,
  converterMessages,
  funMessages,
  gamesMessages,
  storeMessages,
  downloaderMessages,
};
