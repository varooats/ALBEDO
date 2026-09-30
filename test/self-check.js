const assert = require('node:assert');
const path = require('node:path');
const { ANSI } = require('../src/utils/logger');

console.log(`
${ANSI.lavender}▄█████  ██▓    ▄▄▄▄    ▓█████  ▓█████▄  ▒█████
   ▓█   ▀ ▓██▒   ▓█████▄  ▓█   ▀  ▒██▀ ██▌▒██▒  ██▒
   ▒███   ▒██░   ▒██▒ ▄██ ▒███    ░██   █▌▒██░  ██▒
   ▒▓█  ▄ ▒██░   ▒██░█▀   ▒▓█  ▄  ░▓█▄   ▌▒██   ██░
   ░▒████▒░██████▒▓█  ▀█▓ ░▒████▒ ░▒████▓ ░ ████▓▒░
   ░░ ▒░ ░░ ▒░▓  ░▒▓███▀▒ ░░ ▒░ ░  ▒▒▓  ▒ ░ ▒░▒░▒░
    ░ ░  ░░ ░ ▒  ░▒░▒   ░  ░ ░  ░  ░ ▒  ▒   ░ ▒ ▒░
      ░    ░ ░    ░    ░    ░     ░ ░  ░ ░ ░ ▒
             ░  ░ ░         ░  ░    ░      ░ ░ ░ ▒ ${ANSI.reset}

${ANSI.darkGray}──────────────────────────────────────────────────────────────${ANSI.reset}
 ${ANSI.cyan}${ANSI.bold}ALBEDO BOT${ANSI.reset} ${ANSI.darkGray}//${ANSI.reset} ${ANSI.lavender}SYSTEM SELF-CHECK VERIFICATION${ANSI.reset}
${ANSI.darkGray}──────────────────────────────────────────────────────────────${ANSI.reset}
`);

let passedCount = 0;

function step(label, fn, extraInfo = '') {
  const padded = label.padEnd(36, '.');
  process.stdout.write(`${ANSI.cyan}[+]${ANSI.reset} ${ANSI.muted}${padded}${ANSI.reset} `);
  try {
    fn();
    const info = extraInfo ? ` ${ANSI.darkGray}(${extraInfo})${ANSI.reset}` : '';
    console.log(`${ANSI.emerald}${ANSI.bold}OK${ANSI.reset}${info}`);
    passedCount++;
  } catch (err) {
    console.log(`${ANSI.coral}${ANSI.bold}FAILED${ANSI.reset}`);
    console.error(`\n${ANSI.coral}[!] Assertion failed in "${label}":${ANSI.reset}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Check messages
step('Verifying message templates', () => {
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
  assert.strictEqual(messages.store.renderProgressBar(6, 20), '▰▰▰▱▱▱▱▱▱▱ 30%');
  assert.strictEqual(messages.store.renderProgressBar(14, 20), '▰▰▰▰▰▰▰▱▱▱ 70%');
});

// 2. Check utils
step('Verifying message utilities', () => {
  const { resolveJid, jidToMentionName, formatCurrency, sendReaction, REACTIONS } = require('../src/utils/message');
  assert.strictEqual(resolveJid({ key: { remoteJid: 'user@s.whatsapp.net' } }), 'user@s.whatsapp.net');
  assert.strictEqual(jidToMentionName('12345@s.whatsapp.net'), '@12345');
  assert.strictEqual(typeof formatCurrency(50000), 'string');
  assert.strictEqual(REACTIONS.SEARCHING, '🔍');
  assert.strictEqual(REACTIONS.PROCESSING, '⏳');
  assert.strictEqual(REACTIONS.SUCCESS, '✅');
  assert.strictEqual(REACTIONS.FAILED, '❌');
  assert.strictEqual(typeof sendReaction, 'function');
});

// 3. Command registry & loader
let commands = [];
const commandMap = new Map();
step('Verifying command registry', () => {
  const { loadCommands } = require('../src/core/command.loader');
  commands = loadCommands(path.join(__dirname, '../src/commands'));
  assert.ok(Array.isArray(commands), 'Commands should be array');
  assert.ok(commands.length >= 48, `Expected >= 48 commands, got ${commands.length}`);

  for (const cmd of commands) {
    assert.ok(cmd.name, 'Command must have a name');
    assert.strictEqual(typeof cmd.execute, 'function', `Command ${cmd.name} must have execute function`);
    commandMap.set(cmd.name, cmd);
    for (const alias of cmd.aliases || []) {
      commandMap.set(alias, cmd);
    }
  }
}, `${commands.length} commands`);

// 4. General & Fun commands
step('Verifying general & fun commands', () => {
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
});

// 5. Game commands
step('Verifying game commands', () => {
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
});

// 6. Downloader commands
step('Verifying downloader commands', () => {
  assert.ok(commandMap.has('download'));
  assert.ok(commandMap.has('play'));
  assert.ok(commandMap.has('tiktok'));
  assert.ok(commandMap.has('youtube'));
  assert.ok(commandMap.has('instagram'));
  assert.ok(commandMap.has('facebook'));
  assert.ok(commandMap.has('threads'));
  assert.ok(commandMap.has('bluesky'));
  assert.ok(commandMap.has('twitter'));
  assert.ok(commandMap.has('pinterest'));
  assert.ok(commandMap.has('dlpick'));
  assert.ok(commandMap.has('reddit'));
  assert.ok(commandMap.has('douyin'));
  assert.ok(commandMap.has('soundcloud'));
  assert.ok(commandMap.has('bilibili'));
});

// 6b. SMDownloader Response Normalization
step('Verifying SMDownloader normalization', () => {
  const { normalizeSmResponse } = require('../src/services/downloader/sm.service');
  const mockResponse = {
    ok: true,
    data: {
      platform: 'youtube',
      platformName: 'YouTube',
      title: 'Test Video',
      author: 'Tester',
      sourceUrl: 'https://youtube.com/watch?v=123',
      media: [
        {
          type: 'video',
          role: 'video',
          url: '/api/youtube/download?t=123',
          label: '720p',
          filesizeBytes: 5000000,
          container: 'mp4',
          durationMs: 60000,
        },
      ],
    },
  };
  const normalized = normalizeSmResponse(mockResponse, 'https://youtube.com/watch?v=123');
  assert.ok(normalized, 'Normalized object should exist');
  assert.strictEqual(normalized.title, 'Test Video');
  assert.strictEqual(normalized.provider, 'smdownloader');
  assert.strictEqual(normalized.video.url, 'https://www.smdownloader.com/api/youtube/download?t=123');
  assert.strictEqual(normalized.duration, '1:00');
  assert.strictEqual(normalized.media.length, 1);
});

// 7. XP Engine
step('Verifying XP calculation engine', () => {
  const { getLevelForXp } = require('../src/features/games/xp.engine');
  assert.strictEqual(getLevelForXp(0), 1);
  assert.strictEqual(getLevelForXp(99), 1);
  assert.strictEqual(getLevelForXp(100), 2);
  assert.strictEqual(getLevelForXp(250), 3);
  assert.strictEqual(getLevelForXp(500), 4);
  assert.strictEqual(getLevelForXp(850), 5);
});

// 8. Game State
step('Verifying game session manager', () => {
  const { setSession, getSession, deleteSession } = require('../src/features/games/game.state');
  setSession('test@chat', { type: 'quiz', answer: 'A' });
  assert.strictEqual(getSession('test@chat')?.type, 'quiz');
  deleteSession('test@chat');
  assert.strictEqual(getSession('test@chat'), null);
});

// 9. Limit Service
step('Verifying user limit scaling', () => {
  const { calculateLimitPrice, DEFAULT_LIMIT } = require('../src/services/limit/limit.service');
  assert.strictEqual(DEFAULT_LIMIT, 20);
  assert.strictEqual(calculateLimitPrice(20, 10), 500);
  assert.strictEqual(calculateLimitPrice(70, 10), 1000);
  assert.strictEqual(calculateLimitPrice(20, 50), 2500);
});

// 10. Registration & Free Commands
step('Verifying command permissions gate', () => {
  const { GUEST_COMMANDS, FREE_COMMANDS } = require('../src/handlers/command.handler');
  assert.ok(GUEST_COMMANDS.has('register'));
  assert.ok(GUEST_COMMANDS.has('menu'));
  assert.ok(!GUEST_COMMANDS.has('brat'));
  assert.ok(!GUEST_COMMANDS.has('quiz'));
  assert.ok(!GUEST_COMMANDS.has('suit'));
  assert.ok(!GUEST_COMMANDS.has('profile'));
  assert.ok(!GUEST_COMMANDS.has('store'));
  assert.ok(!GUEST_COMMANDS.has('limit'));
  assert.ok(FREE_COMMANDS.has('editprofile'));
  assert.ok(FREE_COMMANDS.has('banuser'));
  assert.ok(FREE_COMMANDS.has('audit'));
  assert.ok(FREE_COMMANDS.has('shutdown'));
  assert.ok(FREE_COMMANDS.has('maintenance'));
  assert.ok(FREE_COMMANDS.has('privacy'));
});

// 11. User Model
step('Verifying user data model', () => {
  const { createUserModel } = require('../src/database/models/user.model');
  const newUser = createUserModel({ jid: '123@s.whatsapp.net', name: 'Tester' });
  assert.strictEqual(newUser.limit, 20, 'New user default limit must be 20');
  assert.strictEqual(newUser.privacy.profile, 'public');
  assert.strictEqual(newUser.privacy.stats, 'public');
  assert.strictEqual(newUser.privacy.history, 'private');
});

// 12. Data Loader
step('Verifying game data banks', () => {
  const dataLoader = require('../src/features/games/data.loader');
  assert.ok(dataLoader.getTebakGambar().length > 0);
  assert.ok(dataLoader.getTebakKata().length > 0);
  assert.ok(dataLoader.getSusunKata().length > 0);
  assert.ok(dataLoader.getCakLontong().length > 0);
  assert.ok(dataLoader.getSiapakahAku().length > 0);
  assert.ok(dataLoader.getTebakBendera().length > 0);
  assert.ok(dataLoader.getAsahOtak().length > 0);
});

// 13. Tioo Downloader Service
step('Verifying Tioo API service', () => {
  const { detectPlatform, downloadMedia, fetchFromTioo, detectAudioFormat, fetchAudioBuffer, isValidAudioBuffer, cleanMediaUrl, normalizeTiooResponse } = require('../src/services/downloader/tioo.service');
  assert.strictEqual(detectPlatform('https://www.youtube.com/watch?v=123'), 'YouTube');
  assert.strictEqual(detectPlatform('https://music.youtube.com/watch?v=123'), 'YouTube');
  assert.strictEqual(detectPlatform('https://vt.tiktok.com/123'), 'TikTok');
  assert.strictEqual(detectPlatform('https://www.instagram.com/reel/123'), 'Instagram');
  assert.strictEqual(detectPlatform('https://open.spotify.com/track/123'), 'Spotify');
  assert.strictEqual(detectPlatform('https://pin.it/123'), 'Pinterest');
  assert.strictEqual(cleanMediaUrl('https://www.instagram.com/reel/DbxrhrzTHi1/?stkn=dzYzYngwbTZsc2Vz'), 'https://www.instagram.com/reel/DbxrhrzTHi1/');
  assert.strictEqual(typeof downloadMedia, 'function');
  assert.strictEqual(typeof fetchFromTioo, 'function');
  assert.strictEqual(typeof fetchAudioBuffer, 'function');
  assert.strictEqual(typeof isValidAudioBuffer, 'function');

  // Verify Spotify payload parsing
  const mockSpotify = {
    status: true,
    message: 'success',
    res_data: {
      title: "c'est la vie - demxntia",
      thumbnail: 'https://i.scdn.co/image/test.jpg',
      formats: [{ url: 'https://spotimate.io/dl?token=123', ext: 'mp3' }],
    },
  };
  const parsed = normalizeTiooResponse(mockSpotify, 'https://open.spotify.com/track/123');
  assert.ok(parsed.audio?.url);
  assert.strictEqual(parsed.source, 'Spotify');
  assert.strictEqual(parsed.thumbnail, 'https://i.scdn.co/image/test.jpg');
});

// 14. Audio format detection
step('Verifying audio binary sniffing', () => {
  const { detectAudioFormat } = require('../src/services/downloader/tioo.service');
  const id3Mp3 = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  assert.strictEqual(detectAudioFormat(id3Mp3).mime, 'audio/mpeg');
  assert.strictEqual(detectAudioFormat(id3Mp3).ext, 'mp3');

  const syncMp3 = Buffer.from([0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  assert.strictEqual(detectAudioFormat(syncMp3).mime, 'audio/mpeg');

  const m4aAudio = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20]);
  assert.strictEqual(detectAudioFormat(m4aAudio).mime, 'audio/mp4');
  assert.strictEqual(detectAudioFormat(m4aAudio).ext, 'm4a');
});

// 15. YouTube Search & YTDL Service
step('Verifying YouTube & YTDL service', () => {
  const { searchYouTube } = require('../src/services/downloader/youtube.search');
  assert.strictEqual(typeof searchYouTube, 'function');
  const { downloadWithYtdlCore, isYtdlAvailable } = require('../src/services/downloader/ytdl.service');
  assert.strictEqual(typeof downloadWithYtdlCore, 'function');
  assert.strictEqual(typeof isYtdlAvailable, 'function');
  const { extractVideoId, downloadYouTubeAudio, downloadYouTubeVideo } = require('../src/services/downloader/youtubei.service');
  assert.strictEqual(typeof downloadYouTubeAudio, 'function');
  assert.strictEqual(typeof downloadYouTubeVideo, 'function');
  assert.strictEqual(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.strictEqual(extractVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.strictEqual(extractVideoId('https://youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

// 16. Downloader Limits
step('Verifying downloader payloads & limits', () => {
  const { MAX_VIDEO_SIZE_BYTES, MAX_AUDIO_SIZE_BYTES } = require('../src/services/downloader/tioo.service');
  const { SUPPORTED_PLATFORMS } = require('../src/messages/downloader.messages');
  assert.strictEqual(MAX_VIDEO_SIZE_BYTES, 35 * 1024 * 1024);
  assert.strictEqual(MAX_AUDIO_SIZE_BYTES, 10 * 1024 * 1024);
  assert.ok(SUPPORTED_PLATFORMS.includes('TikTok'));
  assert.ok(SUPPORTED_PLATFORMS.includes('Spotify'));
});

// 17. Brat Generator
step('Verifying Brat SVG rendering', () => {
  const { generateBratSvg, THEMES } = require('../src/services/media/brat.service');
  const bratSvg = generateBratSvg('albedo brat', { theme: 'white' });
  assert.ok(bratSvg.includes('<svg') && bratSvg.includes('Arial Narrow'));
  assert.ok(THEMES.green && THEMES.black && THEMES.white);
});

// 18. Sticker EXIF
step('Verifying WebP EXIF chunk builder', () => {
  const stickerService = require('../src/services/media/sticker.service');
  const dummyWebp = Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.from([0x12, 0x00, 0x00, 0x00]),
    Buffer.from('WEBP'),
    Buffer.from('VP8 '),
    Buffer.from([0x06, 0x00, 0x00, 0x00]),
    Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  ]);
  const withExif = stickerService.addExif(dummyWebp, 'TestPack', 'TestAuthor');
  assert.strictEqual(withExif.subarray(0, 4).toString(), 'RIFF');
  assert.strictEqual(withExif.subarray(8, 12).toString(), 'WEBP');
  assert.strictEqual(withExif.subarray(12, 16).toString(), 'VP8X');
  assert.ok((withExif[20] & 0x08) !== 0);
  assert.ok(withExif.includes(Buffer.from('EXIF')));
  assert.ok(withExif.includes(Buffer.from('TestPack')));
});

// 19. Group & Moderation commands
step('Verifying group moderation commands', () => {
  assert.ok(commandMap.has('antilink'));
  assert.ok(commandMap.has('addlink'));
  assert.ok(commandMap.has('dellink'));
  assert.ok(commandMap.has('listlink'));
  assert.ok(commandMap.has('antitoxic'));
  assert.ok(commandMap.has('addbadword'));
  assert.ok(commandMap.has('delbadword'));
  assert.ok(commandMap.has('listbadword'));
  assert.ok(commandMap.has('hidetag'));
  assert.ok(commandMap.has('ta'));
  assert.ok(commandMap.has('grouplink'));
  assert.ok(commandMap.has('kick'));
  assert.ok(commandMap.has('promote'));
  assert.ok(commandMap.has('demote'));
  assert.ok(commandMap.has('opengroup'));
  assert.ok(commandMap.has('closegroup'));
  assert.ok(commandMap.has('groupinfo'));
  assert.ok(commandMap.has('membercount'));
  assert.ok(commandMap.has('messagecount'));
  assert.ok(commandMap.has('pinchat'));
  assert.ok(commandMap.has('unpinchat'));
  assert.ok(commandMap.has('group'));
  assert.ok(commandMap.has('afk'));
  assert.ok(commandMap.has('settings'));
  assert.ok(commandMap.has('enable'));
  assert.ok(commandMap.has('disable'));
  assert.ok(commandMap.has('approvegroup'));
  assert.ok(commandMap.has('leavegroup'));
});

// 20. Menu Audio
step('Verifying menu audio subsystem', () => {
  const menuAudio = require('../src/features/menu/menu.audio');
  assert.strictEqual(typeof menuAudio.getFfmpegPath, 'function');
  assert.strictEqual(typeof menuAudio.getAudioFiles, 'function');
  assert.strictEqual(typeof menuAudio.getRandomAudioFile, 'function');
  assert.strictEqual(typeof menuAudio.convertToOpus, 'function');
  assert.strictEqual(typeof menuAudio.generateWaveform, 'function');
  assert.strictEqual(typeof menuAudio.calculateWaveformWithFfmpeg, 'function');
  assert.strictEqual(typeof menuAudio.sendMenuAudio, 'function');
});

// 21. Group Access & Approval
step('Verifying group approval & join guard', () => {
  const { groupAccessMiddleware, checkCommandAccess } = require('../src/core/middleware');
  assert.strictEqual(typeof groupAccessMiddleware, 'function');
  assert.strictEqual(typeof checkCommandAccess, 'function');

  const groupApproval = require('../src/services/group/group-approval.service');
  assert.strictEqual(typeof groupApproval.handleBotGroupJoin, 'function');
  assert.strictEqual(typeof groupApproval.scheduleAutoLeave, 'function');
  assert.strictEqual(typeof groupApproval.cancelAutoLeave, 'function');
});

// 22. Dynamic Config Loading
step('Verifying dynamic configuration', () => {
  const configIndex = require('../src/config');
  assert.strictEqual(typeof configIndex.getConfig, 'function');
});

// 23. Firebase Environment Resolution
step('Verifying Firebase credentials loader', () => {
  const firebaseModule = require('../src/database/firebase');
  assert.strictEqual(typeof firebaseModule.resolveServiceAccount, 'function');
  assert.ok(firebaseModule.resolveServiceAccount() !== null);
});

// 24. Cyberpunk Soft Logger
step('Verifying cyberpunk soft logger', () => {
  const { logger: albedoLogger } = require('../src/utils/logger');
  assert.strictEqual(typeof albedoLogger.banner, 'function');
  assert.strictEqual(typeof albedoLogger.msg, 'function');
  assert.strictEqual(typeof albedoLogger.cmd, 'function');
  assert.strictEqual(typeof albedoLogger.resp, 'function');
  assert.strictEqual(typeof albedoLogger.media, 'function');
  assert.strictEqual(typeof albedoLogger.group, 'function');
  assert.strictEqual(typeof albedoLogger.security, 'function');
  assert.strictEqual(typeof albedoLogger.warn, 'function');
  assert.strictEqual(typeof albedoLogger.error, 'function');
  assert.ok(ANSI.cyan && ANSI.lavender && ANSI.emerald && ANSI.coral && ANSI.amber);
});

// 25. Security & Control Commands
step('Verifying 12 security & control commands', () => {
  assert.ok(commandMap.has('banuser'), 'banuser command should exist');
  assert.ok(commandMap.has('unbanuser'), 'unbanuser command should exist');
  assert.ok(commandMap.has('checkban'), 'checkban command should exist');
  assert.ok(commandMap.has('listban'), 'listban command should exist');
  assert.ok(commandMap.has('audit'), 'audit command should exist');
  assert.ok(commandMap.has('shutdown'), 'shutdown command should exist');
  assert.ok(commandMap.has('maintenance'), 'maintenance command should exist');
  assert.ok(commandMap.has('privacy'), 'privacy command should exist');
  assert.ok(commandMap.has('addowner'), 'addowner command should exist');
  assert.ok(commandMap.has('delowner'), 'delowner command should exist');
  assert.ok(commandMap.has('listowner'), 'listowner command should exist');
  assert.ok(commandMap.has('addadmin'), 'addadmin command should exist');
  assert.ok(commandMap.has('deladmin'), 'deladmin command should exist');
  assert.ok(commandMap.has('restart'), 'restart command should exist');
  assert.ok(commandMap.has('backup'), 'backup command should exist');
});

// 26. Blacklist Service
step('Verifying user blacklist service', () => {
  const blacklistService = require('../src/services/security/blacklist.service');
  assert.strictEqual(typeof blacklistService.banUser, 'function');
  assert.strictEqual(typeof blacklistService.unbanUser, 'function');
  assert.strictEqual(typeof blacklistService.isBanned, 'function');
  assert.strictEqual(typeof blacklistService.getBanInfo, 'function');
  assert.strictEqual(typeof blacklistService.listBannedUsers, 'function');
});

// 27. Anti-Abuse Rate Limit Engine
step('Verifying anti-abuse rate limit engine', () => {
  const { checkRateLimit, resetRateLimits, USER_LIMIT, GROUP_LIMIT, GLOBAL_LIMIT } = require('../src/core/rate-limit');
  resetRateLimits();
  assert.strictEqual(USER_LIMIT, 5);
  assert.strictEqual(GROUP_LIMIT, 50);
  assert.strictEqual(GLOBAL_LIMIT, 1000);

  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit({ senderJid: 'user1@s.whatsapp.net', groupJid: 'group1@g.us' });
    assert.strictEqual(res.allowed, true, `User hit ${i + 1} should be allowed`);
  }
  const blockedRes = checkRateLimit({ senderJid: 'user1@s.whatsapp.net', groupJid: 'group1@g.us' });
  assert.strictEqual(blockedRes.allowed, false, '6th user hit should be rate limited');
  assert.strictEqual(blockedRes.reason, 'user');

  const ownerRes = checkRateLimit({ senderJid: 'user1@s.whatsapp.net', groupJid: 'group1@g.us', isOwner: true });
  assert.strictEqual(ownerRes.allowed, true, 'Owner should bypass rate limit');
  resetRateLimits();
});

// 28. Audit Log System
step('Verifying structured audit log system', () => {
  const auditService = require('../src/services/audit/audit.service');
  auditService.clearMemoryLogs();
  auditService.logAudit('OWNER', 'Added owner: 628111');
  auditService.logAudit('GROUP', 'Approved: ALBEDO TEST');
  auditService.logAudit('ADMIN', 'Kicked: 628222');
  auditService.logAudit('SECURITY', 'User blocked: 628333');
  auditService.logAudit('SETTINGS', 'Antilink enabled');
  const allAudit = auditService.getAuditLogs();
  assert.strictEqual(allAudit.length, 5, 'Should have 5 audit entries');
  const groupAudit = auditService.getAuditLogs('GROUP');
  assert.strictEqual(groupAudit.length, 1);
  assert.strictEqual(groupAudit[0].category, 'GROUP');
  const formattedAudit = auditService.formatAuditLogs(allAudit);
  assert.ok(formattedAudit.includes('[OWNER]'));
  assert.ok(formattedAudit.includes('[SECURITY]'));
});

// 29. Emergency Shutdown & Maintenance
step('Verifying shutdown & maintenance logic', () => {
  const systemService = require('../src/services/system/system-control.service');
  assert.strictEqual(systemService.parseDuration('10m'), 10 * 60 * 1000);
  assert.strictEqual(systemService.parseDuration('1h'), 60 * 60 * 1000);
  assert.strictEqual(systemService.parseDuration('30s'), 30 * 1000);
  systemService.setMaintenance(true, { reason: 'Test maintenance' });
  assert.strictEqual(systemService.isMaintenanceActive(), true, 'Maintenance should be active');
  systemService.setMaintenance(false);
  assert.strictEqual(systemService.isMaintenanceActive(), false, 'Maintenance should be inactive');
});

// 30. Feature Kill Switch & Per-Group Control
step('Verifying feature control & categories', () => {
  const featureControl = require('../src/services/feature/feature-control.service');
  assert.strictEqual(featureControl.resolveFeature('download'), 'downloader');
  assert.strictEqual(featureControl.resolveFeature('cekfemboy'), 'fun');
  assert.strictEqual(featureControl.resolveFeature('quiz'), 'games');
  assert.strictEqual(featureControl.resolveFeature('tarot'), 'tarot');
});

// 31. Owner Hierarchy
step('Verifying bot owner hierarchy system', () => {
  const ownerService = require('../src/services/owner/owner.service');
  assert.ok(ownerService.ROLE_RANKS.SUPEROWNER > ownerService.ROLE_RANKS.OWNER);
  assert.ok(ownerService.ROLE_RANKS.OWNER > ownerService.ROLE_RANKS.ADMIN);
  assert.ok(ownerService.ROLE_RANKS.ADMIN > ownerService.ROLE_RANKS.USER);
});

// 32. Anti Self-Target Validation
step('Verifying anti self-target protection', () => {
  const { validateActionTarget } = require('../src/core/middleware');
  assert.strictEqual(typeof validateActionTarget, 'function');
});

// 33. Privacy Mode
step('Verifying user privacy mode engine', () => {
  const privacyService = require('../src/services/user/privacy.service');
  const defaultPrivacy = privacyService.DEFAULT_PRIVACY;
  assert.strictEqual(defaultPrivacy.profile, 'public');
  assert.strictEqual(defaultPrivacy.stats, 'public');
  assert.strictEqual(defaultPrivacy.history, 'private');
  const card = privacyService.formatPrivacyCard(defaultPrivacy);
  assert.ok(card.includes('Profile visibility : Public'));
  assert.ok(card.includes('Activity history   : Private'));
});

// 34. AI Service (APMIX DeepSeek Integration)
step('Verifying AI service & chat session', () => {
  assert.ok(commandMap.has('ai'), 'ai command should exist');
  assert.ok(commandMap.has('chat'), 'chat command should exist');
  const aiService = require('../src/services/ai/ai.service');
  assert.strictEqual(typeof aiService.askAi, 'function');
  assert.strictEqual(typeof aiService.chatAi, 'function');
  assert.strictEqual(typeof aiService.clearSession, 'function');
  assert.strictEqual(typeof aiService.getSession, 'function');
  assert.ok(aiService.DEFAULT_SYSTEM_PROMPT.includes('ALBEDO'));

  // AI Security & Sanitization
  assert.strictEqual(typeof aiService.sanitizePrompt, 'function');
  assert.strictEqual(typeof aiService.sanitizeResponse, 'function');
  assert.strictEqual(aiService.sanitizePrompt('  halo apa kabar  '), 'halo apa kabar');
  assert.throws(() => aiService.sanitizePrompt(''), /tidak boleh kosong/);
  assert.throws(() => aiService.sanitizePrompt('a'.repeat(1001)), /terlalu panjang/);
});

// 35. Support Ticket Forwarding
step('Verifying support ticket forwarding service', () => {
  assert.ok(commandMap.has('report'), 'report command should exist');
  assert.ok(commandMap.has('bug'), 'bug command should exist');
  assert.ok(commandMap.has('feedback'), 'feedback command should exist');
  assert.ok(commandMap.has('request'), 'request command should exist');
  const supportService = require('../src/services/support/support.service');
  assert.strictEqual(typeof supportService.sendTicketToOwners, 'function');
  assert.ok(supportService.TYPE_LABELS.report);
  assert.ok(supportService.TYPE_LABELS.bug);
  assert.ok(supportService.TYPE_LABELS.feedback);
  assert.ok(supportService.TYPE_LABELS.request);
});

// 36. Environment & Multi-Stage Configuration
step('Verifying environment configurations & flags', () => {
  const fs = require('node:fs');
  const config = require('../src/config/bot.config');

  assert.ok(fs.existsSync(path.join(__dirname, '../.env.example')), '.env.example must exist');

  assert.strictEqual(typeof config.env, 'string');
  assert.strictEqual(typeof config.isProd, 'boolean');
  assert.strictEqual(typeof config.isDev, 'boolean');
  assert.strictEqual(typeof config.isStaging, 'boolean');
  assert.strictEqual(typeof config.logLevel, 'string');
  assert.strictEqual(typeof config.debug, 'boolean');
});

// 37. Role Hierarchy & Access System
step('Verifying role hierarchy & access control', () => {
  const { ROLES, ROLE_RANKS, hasRole, resolveEffectiveRole } = require('../src/core/roles');

  assert.ok(ROLE_RANKS[ROLES.SUPEROWNER] > ROLE_RANKS[ROLES.OWNER]);
  assert.ok(ROLE_RANKS[ROLES.OWNER] > ROLE_RANKS[ROLES.ADMIN]);
  assert.ok(ROLE_RANKS[ROLES.ADMIN] > ROLE_RANKS[ROLES.GROUP_ADMIN]);
  assert.ok(ROLE_RANKS[ROLES.GROUP_ADMIN] > ROLE_RANKS[ROLES.USER]);
  assert.ok(ROLE_RANKS[ROLES.USER] > ROLE_RANKS[ROLES.GUEST]);
  assert.strictEqual(ROLE_RANKS[ROLES.BANNED], 0);

  // Owner always has access
  assert.strictEqual(hasRole(ROLES.OWNER, [ROLES.USER]), true);
  assert.strictEqual(hasRole(ROLES.SUPEROWNER, [ROLES.GROUP_ADMIN]), true);

  // Banned user never has access
  assert.strictEqual(hasRole(ROLES.BANNED, [ROLES.USER]), false);

  // Guest access check
  assert.strictEqual(hasRole(ROLES.GUEST, [ROLES.GUEST]), true);
  assert.strictEqual(hasRole(ROLES.GUEST, [ROLES.USER]), false);

  // Role resolution
  assert.strictEqual(resolveEffectiveRole({ isOwner: true }), ROLES.OWNER);
  assert.strictEqual(resolveEffectiveRole({ isGroupAdmin: true }), ROLES.GROUP_ADMIN);
  assert.strictEqual(resolveEffectiveRole({ isRegistered: true, tier: 'free' }), ROLES.USER);
  assert.strictEqual(resolveEffectiveRole({ isRegistered: true, tier: 'vip' }), ROLES.VIP);
  assert.strictEqual(resolveEffectiveRole({ isRegistered: false }), ROLES.GUEST);
});

// 38. Multi-Tenant Scoped User Data
step('Verifying multi-tenant user scope engine', () => {
  const { createScopedUser } = require('../src/database/models/user-scope.model');

  const userA = createScopedUser({ userId: '628111@s.whatsapp.net', scopeId: 'group_A@g.us', limit: 20, level: 3 });
  const userB = createScopedUser({ userId: '628111@s.whatsapp.net', scopeId: 'group_B@g.us', limit: 5, level: 1 });

  assert.strictEqual(userA.userId, userB.userId);
  assert.notStrictEqual(userA.scopeId, userB.scopeId);
  assert.strictEqual(userA.limit, 20);
  assert.strictEqual(userB.limit, 5);
  assert.strictEqual(userA.level, 3);
  assert.strictEqual(userB.level, 1);
});

// 39. Cooldown Engine & Command Control
step('Verifying cooldown engine & command locks', () => {
  const { checkCooldown, resetCooldown } = require('../src/core/cooldown');
  const { isCommandDisabledGlobally, setGlobalCommand } = require('../src/services/feature/feature-control.service');

  // Cooldown tests
  resetCooldown('user_123', 'group_1', 'tiktok');
  const cd1 = checkCooldown('user_123', 'group_1', 'tiktok', 5, false);
  assert.strictEqual(cd1.allowed, true);

  const cd2 = checkCooldown('user_123', 'group_1', 'tiktok', 5, false);
  assert.strictEqual(cd2.allowed, false);
  assert.ok(cd2.remainingSec > 0);

  // Owner bypass
  const cdOwner = checkCooldown('owner_123', 'group_1', 'tiktok', 5, true);
  assert.strictEqual(cdOwner.allowed, true);

  resetCooldown('user_123', 'group_1', 'tiktok');

  // Command control functions
  assert.strictEqual(typeof isCommandDisabledGlobally, 'function');
  assert.strictEqual(typeof setGlobalCommand, 'function');
});

// 40. Profile Default Avatar Fallback
step('Verifying default avatar fallback for profile', async () => {
  const { getDefaultAvatarDataUri } = require('../src/features/profile/profile.card');
  const defaultAvatar = await getDefaultAvatarDataUri();
  assert.ok(defaultAvatar, 'Default avatar data URI should not be null');
  assert.ok(defaultAvatar.startsWith('data:image/jpeg;base64,'));
});

console.log(`
${ANSI.darkGray}──────────────────────────────────────────────────────────────${ANSI.reset}
${ANSI.cyan}[ALBEDO]${ANSI.reset} ${ANSI.emerald}All self-checks passed! ${passedCount}/${passedCount} test suites OK.${ANSI.reset}
${ANSI.cyan}[ALBEDO]${ANSI.reset} ${ANSI.muted}Command registry verified: ${commands.length} commands active.${ANSI.reset}
${ANSI.darkGray}──────────────────────────────────────────────────────────────${ANSI.reset}
`);
