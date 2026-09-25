const QUIZ_BANK = [
  { q: 'Planet terbesar di tata surya?', a: 'B', o: ['Bumi', 'Jupiter', 'Saturnus', 'Mars'] },
  { q: 'Ibu kota Jepang?', a: 'C', o: ['Osaka', 'Kyoto', 'Tokyo', 'Hiroshima'] },
  { q: 'Hewan terbesar di dunia?', a: 'A', o: ['Paus Biru', 'Gajah', 'Jerapah', 'Hiu Paus'] },
  { q: 'Berapa jumlah benua di bumi?', a: 'B', o: ['5', '7', '6', '8'] },
  { q: 'Siapa penemu lampu pijar?', a: 'D', o: ['Newton', 'Einstein', 'Tesla', 'Edison'] },
  { q: 'Warna bendera Jepang?', a: 'A', o: ['Putih Merah', 'Merah Kuning', 'Biru Putih', 'Hijau Putih'] },
  { q: 'Bahasa pemrograman yang dibuat oleh Brendan Eich?', a: 'C', o: ['Python', 'Java', 'JavaScript', 'C++'] },
  { q: 'Gunung tertinggi di dunia?', a: 'B', o: ['K2', 'Everest', 'Kilimanjaro', 'Denali'] },
  { q: 'Organ tubuh terbesar manusia?', a: 'D', o: ['Hati', 'Paru', 'Otak', 'Kulit'] },
  { q: 'Negara dengan penduduk terbanyak?', a: 'A', o: ['India', 'China', 'Amerika', 'Indonesia'] },
  { q: 'Satuan ukuran arus listrik?', a: 'C', o: ['Volt', 'Watt', 'Ampere', 'Ohm'] },
  { q: 'Planet terdekat dengan matahari?', a: 'A', o: ['Merkurius', 'Venus', 'Bumi', 'Mars'] },
  { q: 'Berapa jumlah tulang manusia dewasa?', a: 'B', o: ['198', '206', '212', '220'] },
  { q: 'Siapa penulis novel Harry Potter?', a: 'C', o: ['Tolkien', 'C.S. Lewis', 'J.K. Rowling', 'Stephen King'] },
  { q: 'Logam paling ringan?', a: 'D', o: ['Aluminium', 'Magnesium', 'Titanium', 'Litium'] },
  { q: 'Samudra terluas di dunia?', a: 'A', o: ['Pasifik', 'Atlantik', 'Hindia', 'Arktik'] },
  { q: 'Gas yang paling banyak di atmosfer bumi?', a: 'B', o: ['Oksigen', 'Nitrogen', 'CO2', 'Argon'] },
  { q: 'Mata uang Thailand?', a: 'C', o: ['Rupiah', 'Ringgit', 'Baht', 'Dong'] },
  { q: 'Tahun kemerdekaan Indonesia?', a: 'A', o: ['1945', '1946', '1944', '1950'] },
  { q: 'Vitamin yang dihasilkan dari sinar matahari?', a: 'D', o: ['A', 'B', 'C', 'D'] },
];

const TEBAK_KATA_BANK = [
  { clue: 'Digunakan untuk mengetik', answer: 'KEYBOARD' },
  { clue: 'Alat transportasi roda dua', answer: 'MOTOR' },
  { clue: 'Hewan berkantong dari Australia', answer: 'KANGURU' },
  { clue: 'Buah berwarna kuning melengkung', answer: 'PISANG' },
  { clue: 'Planet merah', answer: 'MARS' },
  { clue: 'Benda langit bercahaya di malam hari', answer: 'BINTANG' },
  { clue: 'Cairan kehidupan tanpa warna', answer: 'AIR' },
  { clue: 'Ibukota Indonesia', answer: 'JAKARTA' },
  { clue: 'Logam mulia berwarna kuning', answer: 'EMAS' },
  { clue: 'Tempat menyimpan uang', answer: 'BANK' },
  { clue: 'Alat untuk melihat benda jauh', answer: 'TELESKOP' },
  { clue: 'Hewan raja hutan', answer: 'SINGA' },
  { clue: 'Minuman dari daun hijau', answer: 'TEH' },
  { clue: 'Bangunan tempat belajar', answer: 'SEKOLAH' },
  { clue: 'Frozen water', answer: 'ES' },
];

const SUSUN_KATA_BANK = [
  { word: 'KEYBOARD', clue: 'Digunakan untuk mengetik' },
  { word: 'KOMPUTER', clue: 'Mesin pengolah data' },
  { word: 'MONITOR', clue: 'Layar tampilan' },
  { word: 'PRINTER', clue: 'Alat cetak dokumen' },
  { word: 'INTERNET', clue: 'Jaringan global' },
  { word: 'TELEPON', clue: 'Alat komunikasi' },
  { word: 'KAMERA', clue: 'Alat menangkap gambar' },
  { word: 'MUSIK', clue: 'Seni suara yang indah' },
  { word: 'ROBOT', clue: 'Mesin otomatis' },
  { word: 'PLANET', clue: 'Benda langit mengorbit' },
];

function shuffleWord(word) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return result === word ? shuffleWord(word) : result;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatQuizChoices(options) {
  const labels = ['A', 'B', 'C', 'D'];
  return options.map((o, i) => `${labels[i]}. ${o}`).join('\n');
}

module.exports = {
  QUIZ_BANK,
  TEBAK_KATA_BANK,
  SUSUN_KATA_BANK,
  shuffleWord,
  pickRandom,
  formatQuizChoices,
};
