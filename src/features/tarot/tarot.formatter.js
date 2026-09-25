/**
 * Tarot Message Formatter - Albedo Signature Style
 * Format:
 * - Title & Footer khas Albedo
 * - Border box HANYA membungkus command (tanpa kalimat penjelas di dalam box)
 * - Penjelasan terpisah di bawah border
 * - Tipografi kaya: monospace (```...```), bold (*...*), miring (_..._), quote (> ...)
 */

function formatTarotMenu() {
  return [
    '╭─『 🔮 ALBEDO TAROT 』',
    '│ ⟢ ```.ramal```',
    '│ ⟢ ```.ramalhidup```',
    '│ ⟢ ```.ramalhariini```',
    '│ ⟢ ```.ramalcinta```',
    '│ ⟢ ```.ramalkarir```',
    '│ ⟢ ```.ramalkeuangan```',
    '│ ⟢ ```.ramaltanya```',
    '╰──────────────────',
    '',
    '_Selamat datang di bilik refleksi batin Albedo._',
    '',
    'Simbol kartu kuno hadir untuk memantulkan apa yang tersembunyi di sudut pikiranmu. Gunakan pembacaan ini sebagai cermin pertimbangan langkah hidupmu.',
    '',
    '*Panduan Ritual:*',
    '• ```.ramal [@user]``` — _Membaca 1 kartu bimbingan jiwa._',
    '• ```.ramalhidup [@user]``` — _Tiga fase: masa lalu, masa kini, & refleksi masa depan._',
    '• ```.ramalhariini``` — _Satu kartu panduan harimu (1x sehari)._',
    '• ```.ramalcinta [@user]``` — _Refleksi dinamika asmara, rasa, & komunikasi batin._',
    '• ```.ramalkarir [@user]``` — _Refleksi arah ambisi, potensi kerja, & tantangan._',
    '• ```.ramalkeuangan [@user]``` — _Refleksi pola materi, kebiasaan, & aliran rezeki._',
    '• ```.ramaltanya <soal>``` — _Petunjuk arah batin (Yes / No / Reflect) atas keraguanmu._',
    '',
    '> 「Dengarkan bisikan kartu, namun tetaplah melangkah dengan kehendakmu sendiri.」',
    '',
    '— *ALBEDO*',
  ].join('\n');
}

function formatSingleCard({ targetMention = null, card, theme = 'general' }) {
  const titles = {
    love: '💖 RAMALAN ASMARA',
    career: '💼 RAMALAN KARIER',
    money: '🪙 RAMALAN KEUANGAN',
    general: '🔮 RAMALAN TAROT',
  };

  const title = titles[theme] || titles.general;
  const keywordsStr = card.keywords.slice(0, 3).map((k) => `_${k}_`).join(' · ');

  const targetLine = targetMention
    ? `_Membuka tabir batin untuk_ *${targetMention}*.\n\n`
    : '_Menatap cermin batin yang terbuka di hadapanmu._\n\n';

  return [
    `╭─『 ${title} 』`,
    `│ ⟢ Kartu   : *${card.name.toUpperCase()}*`,
    `│ ⟢ Posisi  : \`\`\`${card.position}\`\`\``,
    `│ ⟢ Getaran : ${keywordsStr}`,
    '╰──────────────────',
    '',
    targetLine.trim(),
    '',
    `*Makna Kartu:*`,
    card.meaning,
    '',
    `*Pesan Refleksi:*`,
    `_${card.reflection}_`,
    '',
    '> 「Kartu menunjukkan kemungkinan, bukan kepastian. Jalan setelahnya tetap berada di tanganmu.」',
    '',
    '— *ALBEDO*',
  ].join('\n');
}

function formatThreeCardReading({ targetMention = null, cards = [] }) {
  const [past, present, future] = cards;

  const targetLine = targetMention
    ? `_Tiga kartu telah terbuka untuk meraba alur waktu_ *${targetMention}*.\n\n`
    : '_Tiga kartu telah diletakkan di atas meja, merefleksikan alur perjalananmu._\n\n';

  const combinedReflection = [
    `Akar perjalananmu berpijak pada tema _${past.keywords[0]?.toLowerCase() || 'pengalaman terdahulu'}_. `,
    `Di titik sekarang, dinamika _${present.keywords[0]?.toLowerCase() || 'keadaan ini'}_ menuntut perhatian penuh agar kamu tidak kehilangan pijakan. `,
    `Sementara kartu penutup membawa tema _${future.keywords[0]?.toLowerCase() || 'refleksi masa depan'}_ sebagai kemungkinan arah yang dapat kamu bentuk ulang.`,
  ].join('');

  return [
    '╭─『 🌌 TIGA FASE HIDUP 』',
    `│ ⟢ I · Masa Lalu   : *${past.name}* (\`\`\`${past.position}\`\`\`)`,
    `│ ⟢ II · Masa Kini  : *${present.name}* (\`\`\`${present.position}\`\`\`)`,
    `│ ⟢ III · Bayangan  : *${future.name}* (\`\`\`${future.position}\`\`\`)`,
    '╰──────────────────',
    '',
    targetLine.trim(),
    '',
    '*1. Masa Lalu:*',
    `${past.meaning} _(Energi: ${past.keywords.slice(0, 3).join(' · ')})_`,
    '',
    '*2. Masa Kini:*',
    `${present.meaning} _(Energi: ${present.keywords.slice(0, 3).join(' · ')})_`,
    '',
    '*3. Bayangan Masa Depan:*',
    `${future.meaning} _(Energi: ${future.keywords.slice(0, 3).join(' · ')})_`,
    '',
    '*Pesan Benang Takdir:*',
    combinedReflection,
    '',
    '> 「Masa lalu telah menjadi cerita, masa kini adalah kenyataan, dan masa depan selalu menunggu keputusanmu.」',
    '',
    '— *ALBEDO*',
  ].join('\n');
}

function formatDailyTarot({ card }) {
  const keywordsStr = card.keywords.slice(0, 3).map((k) => `_${k}_`).join(' · ');

  return [
    '╭─『 ☀️ KARTU HARIAN 』',
    `│ ⟢ Kartu  : *${card.name.toUpperCase()}*`,
    `│ ⟢ Posisi : \`\`\`${card.position}\`\`\``,
    `│ ⟢ Energi : ${keywordsStr}`,
    '╰──────────────────',
    '',
    '_Satu kartu ditarik untuk memandu harimu dengan ketenangan._',
    '',
    '*Petunjuk Langkah:*',
    card.meaning,
    '',
    '*Renungan Hari Ini:*',
    `_${card.reflection}_`,
    '',
    '> 「Jalani hari ini dengan penuh kesadaran. Sampai bertemu besok.」',
    '',
    '— *ALBEDO*',
  ].join('\n');
}

function formatDailyCooldown({ hoursLeft = 1 }) {
  return [
    '╭─『 ⏳ KARTU HARIAN 』',
    `│ ⟢ Status : \`\`\`SUDAH DIAMBIL\`\`\``,
    `│ ⟢ Reset  : \`\`\`~${hoursLeft} Jam (00:00 WIB)\`\`\``,
    '╰──────────────────',
    '',
    '_Kamu sudah mengambil kartu ramalan untuk hari ini._',
    'Berikan waktu bagi dirimu untuk merenungkan pesan kartu sebelum membuka tabir berikutnya besok.',
    '',
    '— *ALBEDO*',
  ].join('\n');
}

function formatYesNo({ question = '', card, result }) {
  const resultTag = result === 'YES' ? 'YES' : result === 'NO' ? 'NO' : 'REFLECT';

  return [
    '╭─『 ⚖️ JAWABAN ORACLE 』',
    `│ ⟢ Hasil : \`\`\`[ ${resultTag} ]\`\`\``,
    `│ ⟢ Kartu : *${card.name}* (\`\`\`${card.position}\`\`\`)`,
    '╰──────────────────',
    '',
    `*Pertanyaan:* _"${question}"_`,
    '',
    '*Makna Kartu:*',
    card.meaning,
    '',
    '*Pesan Refleksi:*',
    `_${card.reflection}_`,
    '',
    '> 「Kartu tidak menentukan langkah akhirmu. Pertimbangkan kondisi nyata dengan akal sehat.」',
    '',
    '— *ALBEDO*',
  ].join('\n');
}

module.exports = {
  formatTarotMenu,
  formatSingleCard,
  formatThreeCardReading,
  formatDailyTarot,
  formatDailyCooldown,
  formatYesNo,
};
