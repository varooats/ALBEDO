const { getAllCards } = require('./tarot.cards');
const { getUserByJid, saveUser } = require('../../database/repositories/user.repository');

/**
 * Draw a single random card with random position (Upright / Reversed)
 */
function drawCard(excludeNames = []) {
  const cards = getAllCards().filter((c) => !excludeNames.includes(c.name));
  if (cards.length === 0) {
    throw new Error('No cards available to draw.');
  }

  const randomIndex = Math.floor(Math.random() * cards.length);
  const card = cards[randomIndex];
  const isReversed = Math.random() < 0.5;
  const position = isReversed ? 'REVERSED' : 'UPRIGHT';
  const detail = isReversed ? card.reversed : card.upright;

  return {
    name: card.name,
    arcana: card.arcana,
    suit: card.suit,
    number: card.number,
    position,
    keywords: detail.keywords,
    meaning: detail.meaning,
    reflection: detail.reflection,
  };
}

/**
 * Draw multiple unique cards without duplication
 */
function drawMultipleCards(count = 3) {
  const results = [];
  const pickedNames = [];

  for (let i = 0; i < count; i++) {
    const card = drawCard(pickedNames);
    pickedNames.push(card.name);
    results.push(card);
  }

  return results;
}

/**
 * Specific thematic readings for Love, Career, and Money
 * Designed in calm, mystical, and reflective tone without absolute predictions.
 */
function getThematicReading(card, theme = 'general') {
  const name = card.name;
  const pos = card.position;

  if (theme === 'love') {
    if (pos === 'UPRIGHT') {
      return {
        focus: 'Dinamika Hubungan & Komunikasi',
        reading: `Kartu ${name} membawa kesan keterbukaan dan kehangatan yang mengalir. Dalam hubungan, ada energi yang mendukung kejujuran rasa dan ruang untuk saling mendengarkan tanpa prasangka.`,
        reflection: 'Perhatikan kelembutan dalam bertutur kata. Koneksi yang bermakna tidak perlu dipaksakan, melainkan dirawat perlahan dengan saling menghargai batas masing-masing.',
      };
    } else {
      return {
        focus: 'Refleksi Batin & Jeda Emosional',
        reading: `Kartu ${name} dalam posisi terbalik memperlihatkan adanya ganjalan kecil yang mungkin belum terucap. Ada rasa lelah atau keraguan yang sepertinya sedang membutuhkan ruang untuk bernapas sejenak.`,
        reflection: 'Jangan terburu-buru menuntut kejelasan dari orang lain jika hatimu sendiri masih bimbang. Beri jeda agar emosi mereda dan kejernihan kembali hadir.',
      };
    }
  }

  if (theme === 'career') {
    if (pos === 'UPRIGHT') {
      return {
        focus: 'Arah Ambisi & Perkembangan Diri',
        reading: `Kartu ${name} menyiratkan adanya momentum positif di sekeliling usahamu. Ada potensi dan keterampilan yang siap digunakan untuk mengambil langkah terukur dalam pekerjaan.`,
        reflection: 'Fokuskan energimu pada hal yang benar-benar bisa kamu kendalikan. Ketekunan kecil yang dilakukan secara teratur akan membentuk pondasi yang jauh lebih kokoh.',
      };
    } else {
      return {
        focus: 'Evaluasi Ritme & Beban Pikiran',
        reading: `Kartu ${name} terbalik memberi isyarat tentang kejenuhan atau hambatan yang mungkin terasa menguras motivasi. Ada bagian dari ritme kerjamu yang sepertinya perlu ditata ulang.`,
        reflection: 'Periksa kembali prioritasmu dan jangan ragu meminta waktu istirahat. Mengambil jeda sejenak bukanlah langkah mundur, melainkan persiapan agar langkah berikutnya lebih jernih.',
      };
    }
  }

  if (theme === 'money') {
    if (pos === 'UPRIGHT') {
      return {
        focus: 'Pola Kebiasaan Finansial & Keamanan',
        reading: `Kartu ${name} mencerminkan stabilitas yang tumbuh dari kehati-hatian. Ada kesempatan baik untuk menjaga apa yang telah kamu kumpulkan dan menata rencana kebutuhan masa depan.`,
        reflection: 'Keamanan finansial berakar dari rasa cukup dan disiplin mengelola sumber daya. Teruslah membuat keputusan praktis yang didasari kenyataan, bukan sekadar gengsi sesaat.',
      };
    } else {
      return {
        focus: 'Kewaspadaan Pengeluaran & Godaan',
        reading: `Kartu ${name} terbalik mengingatkan pada dorongan pengeluaran impulsif atau kecemasan materi yang berlebihan. Ada kemungkinan kamu tergoda oleh rasa aman yang sifatnya sementara.`,
        reflection: 'Tinjau kembali pos pengeluaranmu dengan tenang. Tunda keinginan yang belum mendesak dan pastikan pondasi kebutuhan pokokmu tetap terlindungi.',
      };
    }
  }

  // Default / General
  return {
    focus: 'Refleksi Diri',
    reading: card.meaning,
    reflection: card.reflection,
  };
}

/**
 * Yes / No Decision Reflection
 */
function evaluateYesNo(card) {
  const majorNum = card.number;
  const isUpright = card.position === 'UPRIGHT';

  let result = 'REFLECT';

  if (card.arcana === 'major') {
    if ([1, 3, 4, 7, 8, 10, 14, 17, 19, 21].includes(majorNum)) {
      result = isUpright ? 'YES' : 'REFLECT';
    } else if ([13, 15, 16].includes(majorNum)) {
      result = isUpright ? 'NO' : 'REFLECT';
    } else {
      result = 'REFLECT';
    }
  } else {
    // Minor Arcana
    if (['pentacles', 'cups'].includes(card.suit)) {
      result = isUpright ? 'YES' : 'REFLECT';
    } else if (card.suit === 'swords') {
      result = isUpright ? 'REFLECT' : 'NO';
    } else {
      result = isUpright ? 'YES' : 'REFLECT';
    }
  }

  return {
    card,
    result,
    reflection: card.reflection,
  };
}

/**
 * Daily Tarot Check & Storage
 * Reset timestamp is calculated for next midnight (00:00 WIB / UTC+7)
 */
async function processDailyTarot(jid) {
  if (!jid) return { success: false, reason: 'unregistered' };

  const user = await getUserByJid(jid);
  if (!user) {
    return { success: false, reason: 'unregistered' };
  }

  const now = new Date();
  // WIB is UTC+7
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const todayDateStr = wibTime.toISOString().split('T')[0];

  const lastDailyDate = user.lastDailyTarotDate || '';

  if (lastDailyDate === todayDateStr) {
    // Calculate time until next midnight WIB
    const nextMidnightWib = new Date(wibTime);
    nextMidnightWib.setUTCHours(24, 0, 0, 0);
    const msUntilReset = nextMidnightWib.getTime() - wibTime.getTime();
    const hoursLeft = Math.max(1, Math.ceil(msUntilReset / (1000 * 60 * 60)));

    return {
      success: false,
      reason: 'cooldown',
      hoursLeft,
    };
  }

  // Draw today's card
  const card = drawCard();

  // Save state
  user.lastDailyTarotDate = todayDateStr;
  user.lastDailyTarotTimestamp = now.toISOString();
  await saveUser(user);

  return {
    success: true,
    card,
    user,
  };
}

module.exports = {
  drawCard,
  drawMultipleCards,
  getThematicReading,
  evaluateYesNo,
  processDailyTarot,
};
