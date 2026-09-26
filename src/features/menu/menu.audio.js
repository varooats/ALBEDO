const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, spawnSync } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

function getFfmpegPath() {
  try {
    const staticFfmpeg = require('ffmpeg-static');
    if (staticFfmpeg && fs.existsSync(staticFfmpeg)) {
      return staticFfmpeg;
    }
  } catch (e) {}

  const standardPaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg'];
  for (const p of standardPaths) {
    if (fs.existsSync(p)) return p;
  }

  try {
    const res = spawnSync('ffmpeg', ['-version'], { timeout: 1000 });
    if (res.status === 0) return 'ffmpeg';
  } catch (e) {}

  return null;
}

function getAudioFiles(audioDir) {
  if (!fs.existsSync(audioDir)) {
    try {
      fs.mkdirSync(audioDir, { recursive: true });
    } catch {}
    return [];
  }

  const supported = new Set(['.mp3', '.ogg', '.opus', '.m4a', '.wav']);
  const files = fs.readdirSync(audioDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return supported.has(ext);
  });

  return files.map((file) => path.join(audioDir, file));
}

function getRandomAudioFile(audioDir) {
  const files = getAudioFiles(audioDir);
  if (!files.length) return null;
  return files[Math.floor(Math.random() * files.length)];
}

async function convertMp3ToOpus(inputPath) {
  const ffmpegPath = getFfmpegPath();
  if (!ffmpegPath) {
    console.warn('[MENU:AUDIO] FFmpeg not found, sending audio directly');
    return {
      buffer: fs.readFileSync(inputPath),
      mimetype: 'audio/mpeg',
    };
  }

  const tmpFile = path.join(os.tmpdir(), `albedo-menu-${Date.now()}-${Math.random().toString(36).slice(2)}.ogg`);

  try {
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', inputPath,
      '-vn',
      '-c:a', 'libopus',
      '-b:a', '128k',
      '-vbr', 'on',
      tmpFile,
    ]);

    const buffer = fs.readFileSync(tmpFile);
    return {
      buffer,
      mimetype: 'audio/ogg; codecs=opus',
    };
  } finally {
    if (fs.existsSync(tmpFile)) {
      try {
        fs.unlinkSync(tmpFile);
      } catch {}
    }
  }
}

async function sendMenuAudio(client, message) {
  const jid = message?.key?.remoteJid;
  if (!client || typeof client.sendMessage !== 'function' || !jid) {
    return false;
  }

  const audioDir = path.resolve(__dirname, '../../../public/assets/audio');
  const chosenAudio = getRandomAudioFile(audioDir);

  if (!chosenAudio) {
    return false;
  }

  const ext = path.extname(chosenAudio).toLowerCase();
  let audioBuffer;
  let mimetype = 'audio/ogg; codecs=opus';

  if (ext === '.mp3') {
    const converted = await convertMp3ToOpus(chosenAudio);
    audioBuffer = converted.buffer;
    mimetype = converted.mimetype;
  } else if (ext === '.ogg' || ext === '.opus') {
    audioBuffer = fs.readFileSync(chosenAudio);
    mimetype = 'audio/ogg; codecs=opus';
  } else {
    audioBuffer = fs.readFileSync(chosenAudio);
    mimetype = ext === '.m4a' ? 'audio/mp4' : 'audio/ogg; codecs=opus';
  }

  try {
    await client.sendMessage(
      jid,
      {
        audio: audioBuffer,
        mimetype,
        ptt: true,
      },
      { quoted: message }
    );
    return true;
  } catch (error) {
    console.warn('[MENU:AUDIO] Failed to send voice note:', error?.message || error);
    return false;
  }
}

module.exports = {
  getFfmpegPath,
  getAudioFiles,
  getRandomAudioFile,
  convertMp3ToOpus,
  sendMenuAudio,
};
