const gamesMessages = {
  menu: [
    '╭─『 GAMES MENU 』',
    '│',
    '│ 🧠 [ `QUIZ` ]',
    '│ ⟢ ```.quiz```',
    '│ ⟢ ```.tebakgambar```',
    '│ ⟢ ```.tebakkata```',
    '│ ⟢ ```.tebakbendera```',
    '│ ⟢ ```.tebaklagu```',
    '│ ⟢ ```.caklontong```',
    '│ ⟢ ```.siapakahaku```',
    '│ ⟢ ```.asahotak```',
    '│ ⟢ ```.tebakfilm```',
    '│ ⟢ ```.tebakkarakter```',
    '│ ⟢ ```.tebakanime```',
    '│',
    '│ 🔤 [ `WORD GAME` ]',
    '│ ⟢ ```.susunkata```',
    '│ ⟢ ```.acakakata```',
    '│ ⟢ ```.katabersambung```',
    '│ ⟢ ```.tebakangka```',
    '│ ⟢ ```.wordle```',
    '│',
    '│ ⚔️ [ `BATTLE` ]',
    '│ ⟢ ```.suit @user```',
    '│ ⟢ ```.duel @user```',
    '│ ⟢ ```.tictactoe @user```',
    '│ ⟢ ```.fight @user```',
    '│',
    '│ 🎲 [ `RANDOM` ]',
    '│ ⟢ ```.dadu```',
    '│ ⟢ ```.coinflip```',
    '│ ⟢ ```.slot```',
    '│ ⟢ ```.roulette```',
    '│',
    '│ 🏆 [ `SYSTEM` ]',
    '│ ⟢ ```.score```',
    '│ ⟢ ```.leaderboard```',
    '│ ⟢ ```.rank```',
    '│ ⟢ ```.daily```',
    '│',
    '╰──────────────────',
    '> 「Tunjukkan kehebatanmu, Tuan.」',
  ].join('\n'),

  quiz: {
    start: ({ q, choices, timeSec = 30 }) => [
      '╭─『 🧠 QUIZ 』',
      '│',
      `│ ⟢ ${q}`,
      '│',
      ...choices.split('\n').map((c) => `│ ${c}`),
      '│',
      `│ ⏱️ Batas waktu: ${timeSec} detik`,
      '╰──────────────────',
      '> Ketik A, B, C, atau D untuk menjawab.',
    ].join('\n'),

    correct: ({ winner, answer, xp = 10, leveledUp = false, newLevel = 1 }) => [
      '╭─『 ✅ BENAR! 』',
      '│',
      `│ ⟢ Pemenang : ${winner}`,
      `│ ⟢ Jawaban  : *${answer}*`,
      `│ ⟢ Reward   : *+${xp} XP*`,
      ...(leveledUp ? [`│ ⟢ Level Up : *Level ${newLevel}* 🎉`] : []),
      '│',
      '╰──────────────────',
    ].join('\n'),

    timeout: (answer) => [
      '╭─『 ⏰ WAKTU HABIS 』',
      '│',
      `│ ⟢ Jawaban : *${answer}*`,
      '│',
      '╰──────────────────',
      '> Tidak ada yang berhasil menjawab tepat waktu.',
    ].join('\n'),

    alreadyActive: 'Masih ada game yang sedang berjalan di chat ini!',
  },

  tebakKata: {
    start: ({ clue, timeSec = 30 }) => [
      '╭─『 📝 TEBAK KATA 』',
      '│',
      `│ ⟢ Clue : *${clue}*`,
      `│ ⏱️ Batas waktu : ${timeSec} detik`,
      '│',
      '╰──────────────────',
      '> Ketik jawaban langsung di chat!',
    ].join('\n'),
  },

  tebakGambar: {
    start: ({ timeSec = 45 }) => [
      '╭─『 🖼️ TEBAK GAMBAR 』',
      '│',
      '│ Tebak makna dari susunan gambar di atas!',
      `│ ⏱️ Batas waktu : ${timeSec} detik`,
      '│',
      '╰──────────────────',
      '> Ketik jawaban langsung di chat!',
    ].join('\n'),
    answerWithDesc: ({ winner, answer, deskripsi = '', xp = 10 }) => [
      '╭─『 ✅ BENAR! 』',
      '│',
      `│ ⟢ Pemenang  : ${winner}`,
      `│ ⟢ Jawaban   : *${answer}*`,
      ...(deskripsi ? [`│ ⟢ Deskripsi : ${deskripsi}`] : []),
      `│ ⟢ Reward    : *+${xp} XP*`,
      '│',
      '╰──────────────────',
    ].join('\n'),
  },

  tebakBendera: {
    start: ({ timeSec = 30 }) => [
      '╭─『 🚩 TEBAK BENDERA 』',
      '│',
      '│ Bendera dari negara manakah ini?',
      `│ ⏱️ Batas waktu : ${timeSec} detik`,
      '│',
      '╰──────────────────',
      '> Ketik nama negara langsung di chat!',
    ].join('\n'),
  },

  cakLontong: {
    start: ({ soal, timeSec = 40 }) => [
      '╭─『 🤪 CAK LONTONG 』',
      '│',
      `│ ⟢ Soal : ${soal}`,
      `│ ⏱️ Batas waktu : ${timeSec} detik`,
      '│',
      '╰──────────────────',
      '> Ingat, jawabannya harus ala Cak Lontong!',
    ].join('\n'),
  },

  siapakahAku: {
    start: ({ soal, timeSec = 30 }) => [
      '╭─『 🤔 SIAPAKAH AKU 』',
      '│',
      `│ ⟢ ${soal}`,
      `│ ⏱️ Batas waktu : ${timeSec} detik`,
      '│',
      '╰──────────────────',
      '> Ketik jawabanmu langsung di chat!',
    ].join('\n'),
  },

  asahOtak: {
    start: ({ soal, timeSec = 30 }) => [
      '╭─『 💡 ASAH OTAK 』',
      '│',
      `│ ⟢ Soal : ${soal}`,
      `│ ⏱️ Batas waktu : ${timeSec} detik`,
      '│',
      '╰──────────────────',
      '> Asah otakmu dan temukan jawabannya!',
    ].join('\n'),
  },

  tebakLagu: {
    start: ({ artis = '', timeSec = 45 }) => [
      '╭─『 🎵 TEBAK LAGU 』',
      '│',
      '│ Dengarkan cuplikan audio di atas!',
      ...(artis ? [`│ ⟢ Artis : *${artis}*`] : []),
      `│ ⏱️ Batas waktu : ${timeSec} detik`,
      '│',
      '╰──────────────────',
      '> Tebak judul lagu tersebut!',
    ].join('\n'),
  },

  susunKata: {
    start: ({ scrambled, clue, timeSec = 30 }) => [
      '╭─『 🔤 SUSUN KATA 』',
      '│',
      `│ ⟢ Huruf : *${scrambled}*`,
      `│ ⟢ Clue  : ${clue}`,
      `│ ⏱️ Batas waktu : ${timeSec} detik`,
      '│',
      '╰──────────────────',
      '> Susun huruf di atas menjadi kata yang benar!',
    ].join('\n'),
  },

  battle: {
    suitStart: ({ p1, p2 }) => [
      '╭─『 🎮 SUIT BATTLE 』',
      '│',
      `│ ${p1} VS ${p2}`,
      '│',
      '│ Pilihan:',
      '│ ✊ Batu',
      '│ ✌️ Gunting',
      '│ 🖐️ Kertas',
      '│',
      '╰──────────────────',
      '> Ketik: .pilih batu / gunting / kertas',
    ].join('\n'),

    suitResult: ({ p1, p2, choice1, choice2, winner, xp = 20 }) => [
      '╭─『 🏆 HASIL SUIT 』',
      '│',
      `│ ⟢ ${p1} : ${choice1}`,
      `│ ⟢ ${p2} : ${choice2}`,
      '│',
      winner === 'draw'
        ? '│ ⟢ Hasil : *SERI (DRAW)*'
        : `│ ⟢ Pemenang : ${winner} (+${xp} XP)`,
      '│',
      '╰──────────────────',
    ].join('\n'),

    tttBoard: ({ p1, p2, turn, board }) => [
      '╭─『 ⚔️ TIC TAC TOE 』',
      '│',
      `│ ❌ ${p1} VS ⭕ ${p2}`,
      '│',
      `│ ${board[0]} | ${board[1]} | ${board[2]}`,
      `│ ${board[3]} | ${board[4]} | ${board[5]}`,
      `│ ${board[6]} | ${board[7]} | ${board[8]}`,
      '│',
      `│ ⟢ Giliran : ${turn}`,
      '╰──────────────────',
      '> Ketik angka 1-9 untuk mengisi kotak.',
    ].join('\n'),

    tttEnd: ({ winner, isDraw = false, xp = 20 }) => [
      '╭─『 🏁 GAME SELESAI 』',
      '│',
      isDraw
        ? '│ ⟢ Hasil : *Permainan Seri (Draw)!*'
        : `│ ⟢ Pemenang : ${winner} (+${xp} XP)`,
      '│',
      '╰──────────────────',
    ].join('\n'),
  },

  random: {
    dadu: (val1, val2 = null) => [
      '╭─『 🎲 LEMPAR DADU 』',
      '│',
      val2 === null
        ? `│ ⟢ Angka dadu : *${val1}* 🎲`
        : `│ ⟢ Kamu : *${val1}* | Bot : *${val2}*`,
      ...(val2 !== null
        ? [val1 > val2 ? '│ ⟢ Hasil : *Menang!* 🎉' : val1 < val2 ? '│ ⟢ Hasil : *Kalah!*' : '│ ⟢ Hasil : *Seri!*']
        : []),
      '│',
      '╰──────────────────',
    ].join('\n'),

    coinflip: (pick, result, win) => [
      '╭─『 🪙 COIN FLIP 』',
      '│',
      `│ ⟢ Tebakan : *${pick}*`,
      `│ ⟢ Koin    : *${result}*`,
      `│ ⟢ Hasil   : *${win ? 'BENAR! (+10 XP)' : 'SALAH!'}*`,
      '│',
      '╰──────────────────',
    ].join('\n'),

    slot: (icons, isWin, xp = 0) => [
      '╭─『 🎰 MESIN SLOT 』',
      '│',
      `│ [ ${icons.join(' | ')} ]`,
      '│',
      isWin
        ? `│ ⟢ *JACKPOT!* 🎉 (+${xp} XP)`
        : '│ ⟢ Belum beruntung, coba lagi!',
      '│',
      '╰──────────────────',
    ].join('\n'),

    roulette: (bullets, died) => [
      '╭─『 💥 RUSSIAN ROULETTE 』',
      '│',
      `│ ⟢ Peluru : ${bullets}/6`,
      died
        ? '│ ⟢ *DOOR!* Kamu tertembak! 💀'
        : '│ ⟢ *KLIK!* Kamu selamat! 🍀 (+5 XP)',
      '│',
      '╰──────────────────',
    ].join('\n'),
  },

  system: {
    score: ({ name, exp, level, rank = '-' }) => [
      '╭─『 🏆 STATISTIK USER 』',
      '│',
      `│ ⟢ User  : *${name}*`,
      `│ ⟢ Level : *Level ${level}*`,
      `│ ⟢ EXP   : \`\`\`${exp} XP\`\`\``,
      `│ ⟢ Rank  : *#${rank}*`,
      '│',
      '╰──────────────────',
      '> Terus mainkan game untuk meningkatkan XP!',
    ].join('\n'),

    leaderboard: (rows = []) => [
      '╭─『 🏆 TOP LEADERBOARD 』',
      '│',
      ...rows.map((r) => `│ ${r.rank}. ${r.name.padEnd(12)} \`\`\`${String(r.exp).padStart(5)} XP\`\`\` (Lv.${r.level})`),
      '│',
      '╰──────────────────',
      '> Gunakan .score untuk melihat statistikmu.',
    ].join('\n'),

    dailyClaimed: (xp = 15) => [
      '╭─『 🎁 DAILY REWARD 』',
      '│',
      `│ ⟢ Klaim harian berhasil!`,
      `│ ⟢ Reward : *+${xp} XP*`,
      '│',
      '╰──────────────────',
      '> Kembali lagi besok untuk klaim berikutnya.',
    ].join('\n'),

    dailyCooldown: (hoursLeft) => [
      '╭─『 ⏳ SUDAH DIKLAIM 』',
      '│',
      '│ Kamu sudah mengambil daily reward hari ini.',
      `│ Coba lagi dalam: *${hoursLeft} jam*.`,
      '│',
      '╰──────────────────',
    ].join('\n'),
  },
};

module.exports = { gamesMessages };
