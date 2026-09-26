const assert = require('node:assert');
const path = require('node:path');

// 1. Check messages
const { messages, formatMessage } = require('../src/messages');
assert.ok(messages.bot, 'messages.bot should exist');
assert.ok(messages.menu, 'messages.menu should exist');
assert.ok(messages.info, 'messages.info should exist');
assert.ok(messages.profile, 'messages.profile should exist');
assert.ok(messages.converter, 'messages.converter should exist');
assert.ok(messages.fun, 'messages.fun should exist');
assert.ok(messages.games, 'messages.games should exist');
assert.ok(messages.store, 'messages.store should exist');

assert.ok(messages.bot.ping().includes('STATUS'), 'Ping should include STATUS box');
assert.strictEqual(formatMessage('Hello {{name}}', { name: 'World' }), 'Hello World');
assert.ok(messages.profile.cardCaption({ name: 'Albedo' }).includes('Albedo'));
assert.ok(messages.info.getPayload('help').sections.length > 0);
assert.ok(!messages.info.getPayload('help').body.includes('- Kontak'));
assert.ok(messages.info.getPayload('owner').body.includes('╭─『 OWNER 』'));
assert.ok(messages.converter.brat.usage.includes('╭─『 PERINTAH 』'));
assert.ok(messages.profile.editprofile.help.includes('╭─『 FIELD 』'));
assert.ok(messages.profile.editprofile.successBox([{ field: 'name', value: 'Albedo' }]).includes('╭─『 PERUBAHAN 』'));
assert.ok(messages.games.menu.includes('╭─『 GAMES MENU 』'), 'Games menu should have title');
assert.ok(messages.store.storeMenu({}).includes('╭─『 🛒 ALBEDO STORE 』'), 'Store menu should have title');
assert.ok(messages.store.limitExhausted({}).includes('╭─『 ⚠️ LIMIT HABIS 』'), 'Limit exhausted should have title');
assert.ok(messages.store.limitStatus({}).includes('╭─『 ⚡ STATUS LIMIT 』'), 'Limit status should have title');

// Progress Bar check (e.g. 6/20 = 30%, 14/20 = 70%)
assert.strictEqual(messages.store.renderProgressBar(6, 20), '▰▰▰▱▱▱▱▱▱▱ 30%');
assert.strictEqual(messages.store.renderProgressBar(14, 20), '▰▰▰▰▰▰▰▱▱▱ 70%');

// 2. Check utils
const { resolveJid, jidToMentionName, formatCurrency, sendReaction, REACTIONS } = require('../src/utils/message.utils');
assert.strictEqual(resolveJid({ key: { remoteJid: 'user@s.whatsapp.net' } }), 'user@s.whatsapp.net');
assert.strictEqual(jidToMentionName('12345@s.whatsapp.net'), '@12345');
assert.strictEqual(typeof formatCurrency(50000), 'string');
assert.strictEqual(REACTIONS.SEARCHING, '🔍');
assert.strictEqual(REACTIONS.PROCESSING, '⏳');
assert.strictEqual(REACTIONS.SUCCESS, '✅');
assert.strictEqual(REACTIONS.FAILED, '❌');
assert.strictEqual(typeof sendReaction, 'function');

// 3. Check command loader
const { loadCommands } = require('../src/core/command.loader');
const commands = loadCommands(path.join(__dirname, '../src/commands'));
assert.ok(Array.isArray(commands), 'Commands should be array');
assert.ok(commands.length >= 42, `Expected >= 42 commands, got ${commands.length}`);

// 4. Verify specific commands exist and have valid structure
const commandMap = new Map();
for (const cmd of commands) {
  assert.ok(cmd.name, 'Command must have a name');
  assert.strictEqual(typeof cmd.execute, 'function', `Command ${cmd.name} must have execute function`);
  commandMap.set(cmd.name, cmd);
  for (const alias of cmd.aliases || []) {
    commandMap.set(alias, cmd);
  }
}

// General & Fun & Store & Limit
assert.ok(commandMap.has('ping'));
assert.ok(commandMap.has('menu'));
assert.ok(commandMap.has('profile'));
assert.ok(commandMap.has('register'));
assert.ok(commandMap.has('editprofile'));
assert.ok(commandMap.has('help'));
assert.ok(commandMap.has('owner'));
assert.ok(commandMap.has('store'));
assert.ok(commandMap.has('limit'));
assert.ok(commandMap.has('brat'));
assert.ok(commandMap.has('bratvid'));
assert.ok(commandMap.has('bratanime'));
assert.ok(commandMap.has('sticker'));
assert.ok(commandMap.has('swm'));
assert.ok(commandMap.has('fun'));
assert.ok(commandMap.has('cekbeban'));
assert.ok(commandMap.has('cekjodoh'));
assert.ok(commandMap.has('cekhargadiri'));

// Games
assert.ok(commandMap.has('games'));
assert.ok(commandMap.has('quiz'));
assert.ok(commandMap.has('tebakkata'));
assert.ok(commandMap.has('susunkata'));
assert.ok(commandMap.has('suit'));
assert.ok(commandMap.has('tictactoe'));
assert.ok(commandMap.has('dadu'));
assert.ok(commandMap.has('coinflip'));
assert.ok(commandMap.has('slot'));
assert.ok(commandMap.has('roulette'));
assert.ok(commandMap.has('score'));
assert.ok(commandMap.has('leaderboard'));
assert.ok(commandMap.has('daily'));
assert.ok(commandMap.has('tebakangka'));
assert.ok(commandMap.has('duel'));
assert.ok(commandMap.has('tebakgambar'));
assert.ok(commandMap.has('tebaklagu'));
assert.ok(commandMap.has('caklontong'));
assert.ok(commandMap.has('siapakahaku'));
assert.ok(commandMap.has('tebakbendera'));
assert.ok(commandMap.has('asahotak'));
assert.ok(commandMap.has('wordle'));

// Downloader
assert.ok(commandMap.has('download'));
assert.ok(commandMap.has('play'));
assert.ok(commandMap.has('tiktok'));
assert.ok(commandMap.has('youtube'));
assert.ok(commandMap.has('instagram'));

// 5. Check XP engine
const { getLevelForXp } = require('../src/features/games/xp.engine');
assert.strictEqual(getLevelForXp(0), 1);
assert.strictEqual(getLevelForXp(99), 1);
assert.strictEqual(getLevelForXp(100), 2);
assert.strictEqual(getLevelForXp(250), 3);
assert.strictEqual(getLevelForXp(500), 4);
assert.strictEqual(getLevelForXp(850), 5);

// 6. Check Game State
const { setSession, getSession, deleteSession } = require('../src/features/games/game.state');
setSession('test@chat', { type: 'quiz', answer: 'A' });
assert.strictEqual(getSession('test@chat')?.type, 'quiz');
deleteSession('test@chat');
assert.strictEqual(getSession('test@chat'), null);

// 7. Check Limit Service & Price Scaling
const { calculateLimitPrice, DEFAULT_LIMIT } = require('../src/features/limit/limit.service');
assert.strictEqual(DEFAULT_LIMIT, 20);
// Base price for 10 limit at base limit 20 = 500 EXP
assert.strictEqual(calculateLimitPrice(20, 10), 500);
// Scaling price: user with limit 70 pays double (1000 EXP for 10 limit)
assert.strictEqual(calculateLimitPrice(70, 10), 1000);
// Scaling price for 50 limit at base limit 20 = 2500 EXP
assert.strictEqual(calculateLimitPrice(20, 50), 2500);

// 8. Check Registration Gatekeeper & Free Commands
const { GUEST_COMMANDS, FREE_COMMANDS } = require('../src/handlers/command.handler');
assert.ok(GUEST_COMMANDS.has('register'), 'register must be a guest command');
assert.ok(GUEST_COMMANDS.has('menu'), 'menu must be a guest command');
assert.ok(!GUEST_COMMANDS.has('brat'), 'brat must require registration');
assert.ok(!GUEST_COMMANDS.has('quiz'), 'quiz must require registration');
assert.ok(!GUEST_COMMANDS.has('suit'), 'suit must require registration');
assert.ok(!GUEST_COMMANDS.has('profile'), 'profile must require registration');
assert.ok(!GUEST_COMMANDS.has('store'), 'store must require registration');
assert.ok(!GUEST_COMMANDS.has('limit'), 'limit must require registration');
assert.ok(FREE_COMMANDS.has('editprofile'), 'editprofile must be a free command');

// 9. Check User Model Default Limit is 20
const { createUserModel } = require('../src/database/models/user.model');
const newUser = createUserModel({ jid: '123@s.whatsapp.net', name: 'Tester' });
assert.strictEqual(newUser.limit, 20, 'New user default limit must be 20');

// 10. Check Data Loader from src/data
const dataLoader = require('../src/features/games/data.loader');
assert.ok(dataLoader.getTebakGambar().length > 0, 'tebakgambar.json should not be empty');
assert.ok(dataLoader.getTebakKata().length > 0, 'tebakkata.json should not be empty');
assert.ok(dataLoader.getSusunKata().length > 0, 'susunkata.json should not be empty');
assert.ok(dataLoader.getCakLontong().length > 0, 'caklontong.json should not be empty');
assert.ok(dataLoader.getSiapakahAku().length > 0, 'siapakahaku.json should not be empty');
assert.ok(dataLoader.getTebakBendera().length > 0, 'tebakbendera.json should not be empty');
assert.ok(dataLoader.getAsahOtak().length > 0, 'asahotak.json should not be empty');

// 11. Check Downloader Service (Tioo API)
const { detectPlatform, downloadMedia, fetchFromTioo, detectAudioFormat, fetchAudioBuffer, isValidAudioBuffer, cleanMediaUrl } = require('../src/services/downloader/tioo.service');
assert.strictEqual(detectPlatform('https://www.youtube.com/watch?v=123'), 'YouTube');
assert.strictEqual(detectPlatform('https://music.youtube.com/watch?v=123'), 'YouTube');
assert.strictEqual(detectPlatform('https://vt.tiktok.com/123'), 'TikTok');
assert.strictEqual(detectPlatform('https://www.instagram.com/reel/123'), 'Instagram');
assert.strictEqual(detectPlatform('https://open.spotify.com/track/123'), 'Spotify');
assert.strictEqual(detectPlatform('https://pin.it/123'), 'Pinterest');
assert.strictEqual(cleanMediaUrl('https://www.instagram.com/reel/DbxrhrzTHi1/?stkn=dzYzYngwbTZsc2Vz'), 'https://www.instagram.com/reel/DbxrhrzTHi1/');
assert.strictEqual(cleanMediaUrl('https://open.spotify.com/track/3zakx7RAwdkUQlOoQ7SJRt?si=abc'), 'https://open.spotify.com/track/3zakx7RAwdkUQlOoQ7SJRt');
assert.strictEqual(typeof downloadMedia, 'function');
assert.strictEqual(typeof fetchFromTioo, 'function');
assert.strictEqual(typeof fetchAudioBuffer, 'function');
assert.strictEqual(typeof isValidAudioBuffer, 'function');

// Audio format detection check:
const id3Mp3 = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
assert.strictEqual(detectAudioFormat(id3Mp3).mime, 'audio/mpeg');
assert.strictEqual(detectAudioFormat(id3Mp3).ext, 'mp3');

const syncMp3 = Buffer.from([0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
assert.strictEqual(detectAudioFormat(syncMp3).mime, 'audio/mpeg');

const m4aAudio = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20]);
assert.strictEqual(detectAudioFormat(m4aAudio).mime, 'audio/mp4');
assert.strictEqual(detectAudioFormat(m4aAudio).ext, 'm4a');

// 12. Check YouTube Search Service & YTDL Service
const { searchYouTube } = require('../src/services/downloader/youtube.search');
assert.strictEqual(typeof searchYouTube, 'function');

const { downloadWithYtdlCore, isYtdlAvailable } = require('../src/services/downloader/ytdl.service');
assert.strictEqual(typeof downloadWithYtdlCore, 'function');
assert.strictEqual(typeof isYtdlAvailable, 'function');

// 13. Check Downloader Limits & Platforms
const { MAX_VIDEO_SIZE_BYTES, MAX_AUDIO_SIZE_BYTES } = require('../src/services/downloader/tioo.service');
const { SUPPORTED_PLATFORMS } = require('../src/messages/downloader.messages');
assert.strictEqual(MAX_VIDEO_SIZE_BYTES, 35 * 1024 * 1024);
assert.strictEqual(MAX_AUDIO_SIZE_BYTES, 10 * 1024 * 1024);
assert.ok(SUPPORTED_PLATFORMS.includes('TikTok'));
assert.ok(SUPPORTED_PLATFORMS.includes('Spotify'));
assert.ok(SUPPORTED_PLATFORMS.includes('Apple Music'));
assert.ok(SUPPORTED_PLATFORMS.includes('Douyin'));
assert.ok(SUPPORTED_PLATFORMS.includes('SoundCloud'));

// 14. Check Brat Generator Service
const { generateBratSvg, THEMES } = require('../src/services/media/brat.service');
const bratSvg = generateBratSvg('albedo brat', { theme: 'white' });
assert.ok(bratSvg.includes('<svg') && bratSvg.includes('Arial Narrow'), 'Brat SVG should use Arial Narrow font');
assert.ok(THEMES.green && THEMES.black && THEMES.white, 'Brat themes should include green, black, white');

// 15. Check Sticker EXIF WebP Spec Compliance
const stickerService = require('../src/services/media/sticker.service');
const dummyWebp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x12, 0x00, 0x00, 0x00]), // size
  Buffer.from('WEBP'),
  Buffer.from('VP8 '),
  Buffer.from([0x06, 0x00, 0x00, 0x00]),
  Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
]);
const withExif = stickerService.addExif(dummyWebp, 'TestPack', 'TestAuthor');
assert.strictEqual(withExif.subarray(0, 4).toString(), 'RIFF');
assert.strictEqual(withExif.subarray(8, 12).toString(), 'WEBP');
assert.strictEqual(withExif.subarray(12, 16).toString(), 'VP8X', 'First chunk must be VP8X');
assert.ok((withExif[20] & 0x08) !== 0, 'VP8X flag must have EXIF bit enabled');
assert.ok(withExif.includes(Buffer.from('EXIF')), 'Must contain EXIF chunk');
assert.ok(withExif.includes(Buffer.from('TestPack')), 'EXIF must contain packname');

// 16. Check New Group, Owner, and Main Commands
assert.ok(commandMap.has('antilink'), 'antilink command should exist');
assert.ok(commandMap.has('addlink'), 'addlink command should exist');
assert.ok(commandMap.has('dellink'), 'dellink command should exist');
assert.ok(commandMap.has('listlink'), 'listlink command should exist');
assert.ok(commandMap.has('antitoxic'), 'antitoxic command should exist');
assert.ok(commandMap.has('addbadword'), 'addbadword command should exist');
assert.ok(commandMap.has('delbadword'), 'delbadword command should exist');
assert.ok(commandMap.has('listbadword'), 'listbadword command should exist');
assert.ok(commandMap.has('hidetag'), 'hidetag command should exist');
assert.ok(commandMap.has('ta'), 'ta alias should exist');
assert.ok(commandMap.has('grouplink'), 'grouplink command should exist');
assert.ok(commandMap.has('kick'), 'kick command should exist');
assert.ok(commandMap.has('promote'), 'promote command should exist');
assert.ok(commandMap.has('demote'), 'demote command should exist');
assert.ok(commandMap.has('opengroup'), 'opengroup command should exist');
assert.ok(commandMap.has('closegroup'), 'closegroup command should exist');
assert.ok(commandMap.has('groupinfo'), 'groupinfo command should exist');
assert.ok(commandMap.has('membercount'), 'membercount command should exist');
assert.ok(commandMap.has('messagecount'), 'messagecount command should exist');
assert.ok(commandMap.has('pinchat'), 'pinchat command should exist');
assert.ok(commandMap.has('unpinchat'), 'unpinchat command should exist');
assert.ok(commandMap.has('afk'), 'afk command should exist');
assert.ok(commandMap.has('settings'), 'settings command should exist');
assert.ok(commandMap.has('enable'), 'enable command should exist');
assert.ok(commandMap.has('disable'), 'disable command should exist');
assert.ok(commandMap.has('setlimit'), 'setlimit command should exist');
assert.ok(commandMap.has('addlimit'), 'addlimit command should exist');
assert.ok(commandMap.has('addowner'), 'addowner command should exist');
assert.ok(commandMap.has('delowner'), 'delowner command should exist');
assert.ok(commandMap.has('listowner'), 'listowner command should exist');
assert.ok(commandMap.has('restart'), 'restart command should exist');
assert.ok(commandMap.has('backup'), 'backup command should exist');

console.log('✅ All self-checks passed! (Commands:', commands.length, ')');
