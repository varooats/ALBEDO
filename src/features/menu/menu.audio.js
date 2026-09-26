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

/**
 * Konversi audio ke OGG Opus mono 48kHz (standar resmi voice note WhatsApp)
 */
async function convertToOpus(inputPath) {
  const ffmpegPath = getFfmpegPath();
  if (!ffmpegPath) {
    console.warn('[MENU:AUDIO] FFmpeg not found, sending audio directly');
    return {
      filePath: inputPath,
      buffer: fs.readFileSync(inputPath),
      mimetype: 'audio/ogg; codecs=opus',
      isTemp: false,
    };
  }

  const tmpFile = path.join(os.tmpdir(), `albedo-menu-${Date.now()}-${Math.random().toString(36).slice(2)}.ogg`);

  try {
    // Encoding voice note WhatsApp: mono (-ac 1), 48kHz (-ar 48000), libopus, vbr on
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', inputPath,
      '-vn',
      '-c:a', 'libopus',
      '-b:a', '64k',
      '-vbr', 'on',
      '-ar', '48000',
      '-ac', '1',
      tmpFile,
    ]);

    const buffer = fs.readFileSync(tmpFile);
    return {
      filePath: tmpFile,
      buffer,
      mimetype: 'audio/ogg; codecs=opus',
      isTemp: true,
    };
  } catch (err) {
    console.warn('[MENU:AUDIO] FFmpeg convert error:', err?.message || err);
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
    return {
      filePath: inputPath,
      buffer: fs.readFileSync(inputPath),
      mimetype: 'audio/ogg; codecs=opus',
      isTemp: false,
    };
  }
}

/**
 * Fallback waveform kalkulasi 64 sample 0-100 via FFmpeg PCM
 * jika peer dependency audio-decode Baileys belum terinstal
 */
async function calculateWaveformWithFfmpeg(inputPathOrBuffer) {
  const ffmpegPath = getFfmpegPath();
  if (!ffmpegPath) return null;

  let inputPath = inputPathOrBuffer;
  let tempInput = null;

  if (Buffer.isBuffer(inputPathOrBuffer)) {
    tempInput = path.join(os.tmpdir(), `albedo-wf-in-${Date.now()}-${Math.random().toString(36).slice(2)}.ogg`);
    fs.writeFileSync(tempInput, inputPathOrBuffer);
    inputPath = tempInput;
  }

  const tempPcm = path.join(os.tmpdir(), `albedo-wf-out-${Date.now()}-${Math.random().toString(36).slice(2)}.raw`);

  try {
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', inputPath,
      '-vn',
      '-f', 's16le',
      '-ac', '1',
      '-ar', '16000',
      tempPcm,
    ]);

    const pcmData = fs.readFileSync(tempPcm);
    const totalSamples = Math.floor(pcmData.length / 2);
    if (totalSamples < 64) return null;

    const samples = 64;
    const blockSize = Math.floor(totalSamples / samples);
    const filteredData = [];

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(pcmData.readInt16LE((blockStart + j) * 2));
      }
      filteredData.push(sum / blockSize);
    }

    const maxVal = Math.max(...filteredData);
    const multiplier = maxVal > 0 ? Math.pow(maxVal, -1) : 1;
    const normalizedData = filteredData.map((n) => n * multiplier);
    const waveform = new Uint8Array(normalizedData.map((n) => Math.floor(100 * n)));

    return Buffer.from(waveform);
  } catch (error) {
    console.warn('[MENU:AUDIO] FFmpeg waveform calculation error:', error?.message || error);
    return null;
  } finally {
    if (tempInput && fs.existsSync(tempInput)) {
      try { fs.unlinkSync(tempInput); } catch {}
    }
    if (fs.existsSync(tempPcm)) {
      try { fs.unlinkSync(tempPcm); } catch {}
    }
  }
}

/**
 * Menghitung waveform 64 sample dinamis mengikuti gelombang audio
 * Mengutamakan Baileys getAudioWaveform(), dengan fallback FFmpeg PCM 64-sample yang identik
 */
async function generateWaveform(audioBuffer, audioPath) {
  // 1. Panggil Baileys getAudioWaveform
  try {
    const { getAudioWaveform } = require('@whiskeysockets/baileys');
    if (typeof getAudioWaveform === 'function') {
      const wf = await getAudioWaveform(audioBuffer || audioPath);
      if (wf && wf.length > 0) {
        return Buffer.from(wf);
      }
    }
  } catch (err) {
    // audio-decode fallback jika belum ada
  }

  // 2. Fallback FFmpeg PCM (64 sample normalisasi 0-100 persis seperti Baileys)
  return calculateWaveformWithFfmpeg(audioPath || audioBuffer);
}

/**
 * Mengirim pesan suara secara langsung ke chat (tanpa reply/quote pesan)
 */
async function sendMenuAudio(client, message) {
  const jid = message?.key?.remoteJid;
  if (!client || typeof client.sendMessage !== 'function' || !jid) {
    return false;
  }

  const audioDir = path.resolve(__dirname, '../../../assets/audio');
  const chosenAudio = getRandomAudioFile(audioDir);

  if (!chosenAudio) {
    return false;
  }

  let converted;
  try {
    converted = await convertToOpus(chosenAudio);
  } catch (err) {
    console.warn('[MENU:AUDIO] Audio conversion failed:', err?.message || err);
    return false;
  }

  const { filePath, buffer: audioBuffer, mimetype, isTemp } = converted;

  try {
    // Generate waveform 64 sample yang naik-turun mengikuti audio
    const waveform = await generateWaveform(audioBuffer, filePath);

    const messagePayload = {
      audio: audioBuffer,
      mimetype: mimetype || 'audio/ogg; codecs=opus',
      ptt: true,
    };

    if (waveform && waveform.length > 0) {
      messagePayload.waveform = waveform;
    }

    // Kirim langsung ke chat tanpa reply (tanpa quoted message)
    await client.sendMessage(jid, messagePayload);
    return true;
  } catch (error) {
    console.warn('[MENU:AUDIO] Failed to send voice note:', error?.message || error);
    return false;
  } finally {
    if (isTemp && filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
  }
}

module.exports = {
  getFfmpegPath,
  getAudioFiles,
  getRandomAudioFile,
  convertToOpus,
  convertMp3ToOpus: convertToOpus,
  calculateWaveformWithFfmpeg,
  generateWaveform,
  sendMenuAudio,
};
