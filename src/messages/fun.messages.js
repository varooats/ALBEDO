const defaultResponses = {
  veryLow: ['Hampir tidak terdeteksi.', 'Masih sangat rendah.', 'Nyaris tidak ada.'],
  low: ['Masih dalam batas normal.', 'Sedikit terdeteksi.', 'Belum terlalu parah.'],
  mid: ['Lumayan seimbang.', 'Berada di tengah-tengah.', 'Masih bisa berubah.'],
  high: ['Mulai mengkhawatirkan.', 'Levelnya cukup tinggi.', 'Sudah mulai terasa.'],
  veryHigh: ['LEVEL KRITIS.', 'Sudah sangat tinggi.', 'Ini sudah tidak main-main.'],
};

const personalResponses = {
  cekbeban: {
    label: 'Beban Grup',
    ranges: {
      veryLow: ['Hampir tidak membebani siapa-siapa.', 'Masih berguna untuk grup.', 'Kontribusinya masih terdeteksi.'],
      low: ['Beban ringan.', 'Kadang membantu, kadang bikin repot.', 'Masih bisa ditoleransi.'],
      mid: ['Mulai terasa bebannya.', 'Grup mulai mempertanyakan keberadaannya.', '50% manusia, 50% beban.'],
      high: ['Server grup mulai keberatan.', 'Beban berat terdeteksi.', 'Admin mulai mempertimbangkan sesuatu.'],
      veryHigh: ['BEBAN GRUP KRITIS.', 'Disarankan jangan banyak tingkah.', 'Keberadaanmu sudah masuk laporan admin.'],
    },
  },
  cekfemboy: {
    label: 'Femboy Level',
    ranges: {
      veryLow: ['Aura maskulin masih sangat kuat.', 'Belum terdeteksi aura femboy.', 'Masih aman dari radar.'],
      low: ['Ada sedikit aura lembut.', 'Radar mulai berbunyi pelan.', 'Masih bisa disangkal.'],
      mid: ['Mulai susah dibedakan.', 'Aura sudah cukup mencurigakan.', '50% femboy, 50% denial.'],
      high: ['Aura femboy mulai dominan.', 'Radar sudah berbunyi keras.', 'Potensi femboy cukup serius.'],
      veryHigh: ['Sudah tidak perlu diperdebatkan.', 'Radar langsung meledak.', 'Femboy level: FINAL BOSS.'],
    },
  },
  cektampan: {
    label: 'Ketampanan',
    ranges: {
      veryLow: ['Kamera depan minta maaf.', 'Ketampanan masih dalam tahap loading.', 'Filter sangat dibutuhkan.'],
      low: ['Lumayan kalau pencahayaan mendukung.', 'Ada potensi, tapi belum matang.', 'Kamera masih ragu.'],
      mid: ['Standar. Tidak mengecewakan.', 'Lumayan buat foto profil.', '50% ganteng, 50% pencahayaan.'],
      high: ['Kamera depan cukup bangga.', 'Lumayan berbahaya.', 'Banyak yang bisa salah fokus.'],
      veryHigh: ['Kamera depan sampai minder.', 'Visualnya sudah tidak santai.', 'Filter malah jadi tidak diperlukan.'],
    },
  },
  cekcantik: {
    label: 'Kecantikan',
    ranges: {
      veryLow: ['Aura masih tertutup.', 'Kamera belum menemukan angle terbaik.', 'Butuh pencahayaan yang lebih bersahabat.'],
      low: ['Ada potensi.', 'Lumayan, tinggal cari angle.', 'Masih aman.'],
      mid: ['Cukup menarik.', 'Standar cantik yang aman.', 'Lumayan untuk bikin penasaran.'],
      high: ['Mulai berbahaya.', 'Aura cantiknya kuat.', 'Kamera cukup kewalahan.'],
      veryHigh: ['VISUAL OVERLOAD.', 'Kamera depan kehilangan fokus.', 'Sudah masuk kategori bikin orang nengok dua kali.'],
    },
  },
  cekdongo: {
    label: 'Kedongoan',
    ranges: {
      veryLow: ['Cukup cerdas untuk bertahan hidup.', 'Otak masih online.', 'Belum ditemukan tanda-tanda kebodohan.'],
      low: ['Kadang error sedikit.', 'Masih bisa mikir.', 'Otak sedang hemat baterai.'],
      mid: ['50% mikir, 50% nekat.', 'Keputusan hidupnya cukup menarik.', 'Kadang pintar, kadang bikin heran.'],
      high: ['Logika mulai meninggalkan grup.', 'Keputusan hidup cukup questionable.', 'Otak sepertinya sedang offline.'],
      veryHigh: ['DONGO TERDETEKSI.', 'Google pun menyerah.', 'Logika terakhir terlihat kemarin.'],
    },
  },
  cekmiskin: {
    label: 'Kemiskinan',
    ranges: {
      veryLow: ['Masih aman secara finansial.', 'Dompet masih bernapas.', 'Belum perlu mengemis.'],
      low: ['Saldo mulai mencurigakan.', 'Dompet agak tipis.', 'Masih bisa beli es teh.'],
      mid: ['Dompet mulai berisik.', 'Saldo tinggal kenangan.', 'Keuangan sedang mode survival.'],
      high: ['Tanggal tua datang terlalu cepat.', 'Dompet minta bantuan.', 'Saldo sudah mulai menghilang.'],
      veryHigh: ['DOMPET KRITIS.', 'Saldo tinggal doa.', 'Disarankan jangan buka mobile banking.'],
    },
  },
  cekboros: {
    label: 'Tingkat Keborosan',
    ranges: {
      veryLow: ['Hemat sekali.', 'Dompet cukup aman.', 'Pengeluaran masih terkendali.'],
      low: ['Sesekali kalap.', 'Masih bisa mengontrol diri.', 'Belanja masih masuk akal.'],
      mid: ['Saldo dan keinginan tidak akur.', 'Lumayan impulsif.', 'Checkout dulu, mikir belakangan.'],
      high: ['Keranjang online terlalu aktif.', 'Diskon sedikit langsung checkout.', 'Dompet mulai trauma.'],
      veryHigh: ['DISKON ADALAH MUSUH TERBESAR.', 'Saldo melihatmu sebagai ancaman.', 'Keranjang belanja lebih panjang dari masa depan.'],
    },
  },
  cekmalas: {
    label: 'Kemalasan',
    ranges: {
      veryLow: ['Rajin dan produktif.', 'Masih punya tenaga.', 'Tidak takut pekerjaan.'],
      low: ['Kadang rebahan.', 'Masih cukup produktif.', 'Mager sesekali itu normal.'],
      mid: ['Rebahan mulai jadi lifestyle.', 'Produktif kalau mood.', '50% kerja, 50% rebahan.'],
      high: ['Kasur adalah tempat ternyaman.', 'Pekerjaan bisa menunggu.', 'Mager sudah mulai serius.'],
      veryHigh: ['REBAHAN ADALAH JALAN HIDUP.', 'Produktivitas telah meninggalkan tubuh.', 'Bangun saja sudah dianggap pencapaian.'],
    },
  },
  cekrajin: {
    label: 'Kerajinan',
    ranges: {
      veryLow: ['Kerja nanti saja.', 'Produktivitas belum ditemukan.', 'Sedang menunggu motivasi.'],
      low: ['Kadang rajin.', 'Tergantung mood.', 'Masih perlu sedikit dorongan.'],
      mid: ['Lumayan produktif.', 'Kalau niat bisa jalan.', 'Kerja ada, rebahan juga ada.'],
      high: ['Produktif banget.', 'Tugas cepat selesai.', 'Lumayan bisa diandalkan.'],
      veryHigh: ['MESIN PRODUKTIVITAS.', 'Kerja terus sampai lupa waktu.', 'Orang lain baru mulai, dia sudah selesai.'],
    },
  },
  cekimut: {
    label: 'Keimutan',
    ranges: {
      veryLow: ['Imutnya masih tersembunyi.', 'Belum terdeteksi aura bayi.', 'Masih terlalu serius.'],
      low: ['Sedikit imut.', 'Ada bibit-bibit.', 'Kadang terlihat menggemaskan.'],
      mid: ['Lumayan imut.', '50% cute, 50% chaos.', 'Bisa bikin orang senyum.'],
      high: ['Imutnya mulai berbahaya.', 'Aura cute sangat kuat.', 'Susah dianggap galak.'],
      veryHigh: ['CUTE OVERLOAD.', 'Tidak boleh dibiarkan terlalu lama.', 'Keimutan sudah mencapai level maksimal.'],
    },
  },
  cekgalak: {
    label: 'Kegalakan',
    ranges: {
      veryLow: ['Lebih mirip anak baik.', 'Sulit terlihat galak.', 'Marahnya mungkin pakai emoji.'],
      low: ['Kadang galak.', 'Masih cukup ramah.', 'Bisa marah kalau dipancing.'],
      mid: ['Tergantung situasi.', 'Kadang santai, kadang meledak.', '50% kalem, 50% ngamuk.'],
      high: ['Aura preman mulai muncul.', 'Jangan terlalu banyak bercanda.', 'Senyumnya mulai mencurigakan.'],
      veryHigh: ['JANGAN CARI MASALAH.', 'Aura boss terakhir.', 'Grup sebaiknya menjaga sikap.'],
    },
  },
  cekbucin: {
    label: 'Level Bucin',
    ranges: {
      veryLow: ['Hati masih aman.', 'Belum dikendalikan pasangan.', 'Masih punya kehidupan sendiri.'],
      low: ['Mulai ada gejala.', 'Sedikit perhatian sudah senang.', 'Belum terlalu parah.'],
      mid: ['Separuh hidupnya untuk pasangan.', 'Chat dibalas dalam hitungan detik.', 'Bucin mulai terlihat.'],
      high: ['Pasangan adalah pusat semesta.', 'Online demi satu orang.', 'Bucin akut.'],
      veryHigh: ['BUCIN FINAL BOSS.', 'Password mungkin nama pasangan.', 'Kalau pasangan offline, ikut offline.'],
    },
  },
  ceksetia: {
    label: 'Kesetiaan',
    ranges: {
      veryLow: ['Komitmen perlu diperiksa.', 'Mata terlalu sering jelalatan.', 'Kesetiaan sedang dipertanyakan.'],
      low: ['Masih bisa ditingkatkan.', 'Lumayan, tapi jangan diuji.', 'Godaan cukup berbahaya.'],
      mid: ['50% setia, 50% tergantung keadaan.', 'Masih dalam zona abu-abu.', 'Bisa setia kalau tidak ada gangguan.'],
      high: ['Komitmennya cukup kuat.', 'Godaan sulit menggoyahkan.', 'Lumayan bisa dipercaya.'],
      veryHigh: ['SETIA LEVEL LEGEND.', 'Godaan lewat, tidak menoleh.', 'Hatinya sudah dikunci.'],
    },
  },
  cektoxic: {
    label: 'Toxic Level',
    ranges: {
      veryLow: ['Lingkungan cukup aman.', 'Tidak banyak drama.', 'Aman untuk didekati.'],
      low: ['Sedikit toxic.', 'Masih bisa ditoleransi.', 'Kadang bikin emosi.'],
      mid: ['Toxic tergantung mood.', 'Drama mulai muncul.', '50% manusia, 50% masalah.'],
      high: ['Red flag mulai terlihat.', 'Jangan terlalu dekat.', 'Potensi drama tinggi.'],
      veryHigh: ['TOXIC ZONE.', 'Hubungan dengan target memerlukan APD.', 'Drama adalah sumber energinya.'],
    },
  },
  cekngantuk: {
    label: 'Tingkat Ngantuk',
    ranges: {
      veryLow: ['Mata masih segar.', 'Belum butuh kopi.', 'Masih sanggup begadang.'],
      low: ['Sedikit mengantuk.', 'Masih aman.', 'Satu kopi cukup.'],
      mid: ['Kelopak mata mulai berat.', 'Chat mulai typo.', 'Setengah sadar.'],
      high: ['Laptop mulai terlihat seperti bantal.', 'Satu menit lagi tidur.', 'Mata sudah menyerah.'],
      veryHigh: ['TIDUR SEKARANG.', 'Kesadaran tinggal 1%.', 'Jempol masih online, otak sudah tidur.'],
    },
  },
  ceklapar: {
    label: 'Tingkat Kelaparan',
    ranges: {
      veryLow: ['Masih kenyang.', 'Belum perlu makan.', 'Perut aman.'],
      low: ['Mulai lapar sedikit.', 'Cemilan sudah menggoda.', 'Masih bisa bertahan.'],
      mid: ['Perut mulai protes.', 'Sudah waktunya cari makanan.', 'Menu mulai memenuhi pikiran.'],
      high: ['Bisa makan dua porsi.', 'Semua benda mulai terlihat seperti makanan.', 'Perut sudah mengajukan komplain.'],
      veryHigh: ['MODE PEMBURU MAKANAN.', 'NASI ADALAH PRIORITAS.', 'Jangan ajak ngobrol sebelum makan.'],
    },
  },
  cekwaras: {
    label: 'Kewarasan',
    ranges: {
      veryLow: ['Masih sangat waras.', 'Mental server stabil.', 'Tidak ada error besar.'],
      low: ['Sedikit error.', 'Masih bisa diajak diskusi.', 'Normal dengan sedikit bug.'],
      mid: ['Stabil tidak stabil.', 'Kadang masuk akal.', '50% waras, 50% chaos.'],
      high: ['Kewarasan mulai menurun.', 'Bug mental terdeteksi.', 'Perlu restart.'],
      veryHigh: ['KEWARASAN TIDAK DITEMUKAN.', 'System failure.', 'Disarankan restart manusia.'],
    },
  },
  cekmesum: {
    label: 'Kemumesan',
    ranges: {
      veryLow: ['Masih sopan.', 'Pikiran cukup bersih.', 'Belum ada indikasi aneh.'],
      low: ['Sedikit mencurigakan.', 'Kadang kepikiran yang aneh.', 'Masih bisa dipercaya.'],
      mid: ['Pikiran mulai random.', '50% polos, 50% tidak.', 'Riwayat pencarian sebaiknya dirahasiakan.'],
      high: ['Pikiran sudah tidak aman.', 'Radar mesum aktif.', 'Jangan kasih akses internet.'],
      veryHigh: ['MESUM LEVEL MAX.', 'Browser history adalah barang bukti.', 'Incognito mode adalah rumah kedua.'],
    },
  },
  cekkepo: {
    label: 'Kepoan',
    ranges: {
      veryLow: ['Tidak terlalu peduli urusan orang.', 'Privasi orang aman.', 'Tidak suka ikut campur.'],
      low: ['Kadang penasaran.', 'Masih tahu batas.', 'Sedikit kepo tidak masalah.'],
      mid: ['Mulai suka stalking.', 'Info grup selalu dibaca.', '50% penasaran, 50% FBI.'],
      high: ['Semua drama diketahui.', 'Kepo tingkat admin.', 'Tidak ada yang bisa disembunyikan.'],
      veryHigh: ['FBI CABANG GRUP.', 'Orang belum cerita, dia sudah tahu.', 'Privasi? Apa itu?'],
    },
  },
  cekjulid: {
    label: 'Kejulidan',
    ranges: {
      veryLow: ['Tidak suka nyinyir.', 'Cukup kalem.', 'Tidak terlalu peduli drama.'],
      low: ['Kadang komentar.', 'Masih bisa menahan diri.', 'Sedikit julid.'],
      mid: ['Komentar mulai pedas.', 'Drama adalah tontonan.', '50% netral, 50% nyinyir.'],
      high: ['Mulut cukup berbahaya.', 'Komentarnya lebih pedas dari sambal.', 'Drama belum selesai kalau dia belum komentar.'],
      veryHigh: ['JULID FINAL BOSS.', 'Komentarnya bisa bikin grup hening.', 'Netizen pun takut bersaing.'],
    },
  },
  cekansos: {
    label: 'Ke-ansos-an',
    ranges: {
      veryLow: ['Sangat sosial.', 'Hampir selalu aktif.', 'Kenalan di mana-mana.'],
      low: ['Masih cukup sosial.', 'Sesekali menyendiri.', 'Masih suka ngobrol.'],
      mid: ['Tergantung mood.', 'Bisa rame, bisa hilang.', '50% sosial, 50% menghilang.'],
      high: ['Mulai sering menghilang.', 'Chat dibalas nanti.', 'Offline adalah gaya hidup.'],
      veryHigh: ['ANSOS LEVEL LEGEND.', 'Terakhir terlihat: entah kapan.', 'HP online, orangnya tidak.'],
    },
  },
  cekhalu: {
    label: 'Kehalluan',
    ranges: {
      veryLow: ['Masih berpijak pada kenyataan.', 'Realita aman.', 'Tidak banyak berkhayal.'],
      low: ['Sedikit berimajinasi.', 'Masih bisa kembali ke realita.', 'Halu ringan.'],
      mid: ['Realita dan khayalan mulai bercampur.', 'Lumayan sering berandai-andai.', '50% realita, 50% delusi.'],
      high: ['Dunia khayalan sangat nyaman.', 'Realita mulai diabaikan.', 'Halu cukup serius.'],
      veryHigh: ['TINGGAL DI DUNIA SENDIRI.', 'Realita sudah tidak relevan.', 'Khayalan lebih nyata daripada kenyataan.'],
    },
  },
  cekalay: {
    label: 'Ke-alay-an',
    ranges: {
      veryLow: ['Masih normal.', 'Tidak terlalu alay.', 'Gaya chat cukup aman.'],
      low: ['Sedikit alay.', 'Masih bisa disembuhkan.', 'Kadang typo aesthetic.'],
      mid: ['Alay mulai terasa.', 'Capslock mulai aktif.', '50% normal, 50% alay.'],
      high: ['ALAY TERDETEKSI.', 'Gaya chat cukup mencolok.', 'Capslock adalah sahabat.'],
      veryHigh: ['ALAY FINAL BOSS.', 'Status Facebook 2012 masih hidup.', 'Keyboard mungkin penuh simbol.'],
    },
  },
  cekbadut: {
    label: 'Kebadutan',
    ranges: {
      veryLow: ['Masih menjaga harga diri.', 'Tidak mudah dipermainkan.', 'Badut belum keluar.'],
      low: ['Sedikit suka menghibur orang.', 'Kadang jadi korban.', 'Masih aman.'],
      mid: ['Mulai jadi badut.', 'Senyum padahal sakit.', '50% manusia, 50% badut.'],
      high: ['Badut profesional.', 'Sudah sering menghibur orang yang tidak peduli.', 'Harga diri mulai diskon.'],
      veryHigh: ['BADUT NASIONAL.', 'Circus sedang mencari talent.', 'Badutnya bukan lagi pekerjaan, tapi identitas.'],
    },
  },
  cekmager: {
    label: 'Kemageran',
    ranges: {
      veryLow: ['Rajin bergerak.', 'Jarang rebahan.', 'Energi masih penuh.'],
      low: ['Kadang mager.', 'Masih mau bergerak.', 'Rebahan sesekali.'],
      mid: ['Mager cukup dominan.', 'Kalau bisa duduk kenapa berdiri.', 'Rebahan mulai nyaman.'],
      high: ['Bergerak adalah pilihan terakhir.', 'Kasur adalah prioritas.', 'Mager sudah kronis.'],
      veryHigh: ['MAGER ABSOLUT.', 'Teleport ke kasur adalah cita-cita.', 'Gravitasi kasur terlalu kuat.'],
    },
  },
  cekpanik: {
    label: 'Kepanikan',
    ranges: {
      veryLow: ['Tetap tenang.', 'Tidak mudah panik.', 'Mental cukup stabil.'],
      low: ['Sedikit gugup.', 'Masih bisa berpikir.', 'Panik tipis-tipis.'],
      mid: ['Panik mulai terasa.', 'Otak mulai loading.', '50% tenang, 50% panik.'],
      high: ['PANIK TERDETEKSI.', 'Otak mulai buffering.', 'Masalah kecil terasa seperti kiamat.'],
      veryHigh: ['PANIK TOTAL.', 'Sistem mengalami overload.', 'Tidak ada keputusan yang aman.'],
    },
  },
  cekdrama: {
    label: 'Potensi Drama',
    ranges: {
      veryLow: ['Hidup cukup damai.', 'Drama jauh dari radar.', 'Tidak suka ribut.'],
      low: ['Kadang terlibat drama.', 'Masih cukup tenang.', 'Drama kecil sesekali.'],
      mid: ['Drama mulai mendekat.', 'Ada potensi konflik.', 'Hidupnya lumayan sinetron.'],
      high: ['Drama mengikuti ke mana pun.', 'Episode baru setiap minggu.', 'Masalah datang sendiri.'],
      veryHigh: ['SUMBER DRAMA UTAMA.', 'Netflix belum siap menayangkan hidupnya.', 'Episode hidup tidak pernah tamat.'],
    },
  },
  cekkampungan: {
    label: 'Kekampungan',
    ranges: {
      veryLow: ['Aura cukup elegan.', 'Style cukup clean.', 'Tidak banyak tingkah.'],
      low: ['Sedikit kampung.', 'Masih cukup modern.', 'Kadang style-nya questionable.'],
      mid: ['Tergantung tempat.', '50% classy, 50% warga lokal.', 'Lumayan unik.'],
      high: ['Aura kampung sangat kuat.', 'Style cukup mencolok.', 'Tetangga kemungkinan kenal.'],
      veryHigh: ['KETUA RT TERDETEKSI.', 'Aura kampung tidak bisa disembunyikan.', 'Pulang kampung tidak perlu GPS.'],
    },
  },
  cekredflag: {
    label: 'Red Flag',
    ranges: {
      veryLow: ['Hampir tidak ada red flag.', 'Cukup aman.', 'Green flag masih mendominasi.'],
      low: ['Ada sedikit tanda bahaya.', 'Masih bisa dimaklumi.', 'Perlu observasi lebih lanjut.'],
      mid: ['Red flag mulai muncul.', 'Perlu hati-hati.', '50% aman, 50% mencurigakan.'],
      high: ['Banyak tanda bahaya.', 'Perlu berpikir dua kali.', 'Red flag cukup dominan.'],
      veryHigh: ['RED FLAG FACTORY.', 'Jangan abaikan alarm.', 'Tanda bahayanya sudah antre.'],
    },
  },
  cekgreenflag: {
    label: 'Green Flag',
    ranges: {
      veryLow: ['Green flag masih langka.', 'Belum banyak nilai plus.', 'Masih perlu pembuktian.'],
      low: ['Ada beberapa sisi positif.', 'Lumayan.', 'Potensinya ada.'],
      mid: ['Cukup baik.', 'Green flag mulai terlihat.', '50% aman, 50% perlu observasi.'],
      high: ['Banyak nilai plus.', 'Cukup aman untuk dipercaya.', 'Green flag mulai dominan.'],
      veryHigh: ['GREEN FLAG BERJALAN.', 'Orang baik terdeteksi.', 'Sulit menemukan sisi negatifnya.'],
    },
  },
};

const pairResponses = {
  cekcocok: {
    label: 'Tingkat Kecocokan',
    ranges: {
      veryLow: ['Kalau dipaksa cocok, grup yang kena dampaknya.', 'Lebih cocok jadi mutual.', 'Chemistry-nya belum ketemu.'],
      low: ['Masih perlu banyak penyesuaian.', 'Cocoknya tipis.', 'Chemistry belum terlalu terasa.'],
      mid: ['Lumayan cocok.', 'Ada chemistry, tapi jangan terlalu yakin.', 'Masih bisa berkembang.'],
      high: ['Chemistry cukup kuat.', 'Lumayan serasi.', 'Potensi cocoknya tinggi.'],
      veryHigh: ['CHEMISTRY OVERLOAD.', 'Sepertinya memang ada sesuatu.', 'Kalau bukan jodoh, minimal duo maut.'],
    },
  },
  cekchemistry: {
    label: 'Chemistry',
    ranges: {
      veryLow: ['Chemistry tidak ditemukan.', 'Interaksinya terasa seperti customer service.', 'Bicaranya mungkin cuma seperlunya.'],
      low: ['Chemistry tipis.', 'Masih canggung.', 'Butuh lebih banyak interaksi.'],
      mid: ['Ada chemistry.', 'Lumayan nyambung.', 'Percakapannya cukup hidup.'],
      high: ['Chemistry kuat.', 'Obrolannya kemungkinan susah berhenti.', 'Nyambungnya cukup berbahaya.'],
      veryHigh: ['CHEMISTRY MAXIMUM.', 'Orang ketiga mungkin tidak diperlukan.', 'Dua orang ini terlalu nyambung.'],
    },
  },
  ceklove: {
    label: 'Love Compatibility',
    ranges: {
      veryLow: ['Cinta belum terdeteksi.', 'Lebih cocok jadi teman.', 'Hatinya belum satu server.'],
      low: ['Ada sedikit rasa.', 'Potensi masih kecil.', 'Jangan buru-buru confess.'],
      mid: ['Ada kemungkinan.', 'Cukup menarik.', 'Bisa jadi sesuatu.'],
      high: ['Rasa mulai kuat.', 'Potensi hubungan cukup tinggi.', 'Sudah mulai susah dianggap teman.'],
      veryHigh: ['LOVE DETECTED.', 'Cupid sedang bekerja.', 'Ini sudah bukan sekadar teman.'],
    },
  },
  cekfriendship: {
    label: 'Friendship',
    ranges: {
      veryLow: ['Temenan masih terasa formal.', 'Belum terlalu dekat.', 'Masih level kenalan.'],
      low: ['Lumayan kenal.', 'Temenan tipis-tipis.', 'Masih perlu banyak momen.'],
      mid: ['Teman cukup dekat.', 'Lumayan solid.', 'Sudah bisa diajak nongkrong.'],
      high: ['Bestie material.', 'Solid banget.', 'Kemungkinan sudah tahu aib masing-masing.'],
      veryHigh: ['BESTIE FINAL BOSS.', 'Aib sudah saling disimpan.', 'Susah dipisahkan.'],
    },
  },
  cekmusuhan: {
    label: 'Potensi Musuhan',
    ranges: {
      veryLow: ['Aman, tidak ada konflik.', 'Cukup damai.', 'Musuhan hampir tidak terdeteksi.'],
      low: ['Kadang beda pendapat.', 'Masih aman.', 'Konflik kecil mungkin terjadi.'],
      mid: ['Potensi ribut lumayan.', 'Tergantung mood.', '50% damai, 50% chaos.'],
      high: ['Potensi perang cukup tinggi.', 'Jangan duduk bersebelahan terlalu lama.', 'Sedikit salah kata bisa jadi masalah.'],
      veryHigh: ['POTENSI PERANG.', 'Grup sebaiknya menyiapkan moderator.', 'Dua orang ini sebaiknya diberi jarak.'],
    },
  },
};

const jodohResponses = {
  veryLow: ['Mungkin cuma teman satu grup.', 'Cupid bahkan tidak menemukan jalannya.', 'Lebih cocok jadi mutual.'],
  low: ['Ada sedikit kemungkinan.', 'Masih butuh mukjizat.', 'Jodohnya belum terlalu kelihatan.'],
  mid: ['Lumayan punya chemistry.', 'Bisa jadi kalau sama-sama mau.', 'Ada peluang.'],
  high: ['Cupid mulai bekerja.', 'Potensinya cukup besar.', 'Sepertinya ada sesuatu.'],
  veryHigh: ['JODOH TERDETEKSI.', 'Cupid sampai lembur.', 'Grup ini mungkin akan punya pasangan baru.'],
};

const hargaDiriQuotes = {
  low: ['Masih bisa ditawar.', 'Harga kaki lima.', 'Dompet belum perlu berpikir panjang.'],
  mediumLow: ['Lumayan berharga.', 'Masih masuk akal.', 'Tidak murah, tidak mahal.'],
  medium: ['Wah mulai mahal.', 'Lumayan premium.', 'Dompet mulai gemetar.'],
  high: ['Harga premium.', 'Sudah masuk kelas atas.', 'Tidak semua orang mampu.'],
  sultan: ['HARGA SULTAN.', 'Dompet orang biasa tidak kuat.', 'Jangan coba-coba menawar.'],
};

function formatPersonalBox({ title, targetJid, showTarget, bodyLabel, bodyValue, quote, mentionName }) {
  const lines = [
    `╭─『 ${title.toUpperCase()} 』`,
    '│',
  ];
  if (showTarget && (mentionName || targetJid)) {
    lines.push(`│ ⟢ Target : ${mentionName || targetJid}`);
    lines.push('│');
  }
  lines.push(`│ ⟢ ${bodyLabel} : *${bodyValue}*`);
  lines.push('│');
  lines.push('╰���─────────────────');
  lines.push(`> 「${quote}」`);
  return lines.join('\n');
}

function formatPairBox({ title, firstMention, secondMention, bodyLabel, bodyValue, quote }) {
  return [
    `╭─『 ${title.toUpperCase()} 』`,
    '│',
    `│ ⟢ Pasangan : ${firstMention} × ${secondMention}`,
    `│ ⟢ ${bodyLabel} : *${bodyValue}*`,
    '│',
    '╰──────────────────',
    `> 「${quote}」`,
  ].join('\n');
}

function buildFunMenu(commandNames = []) {
  const lines = [
    'Daftar fitur hiburan grup:',
    '',
    '╭─『 FUN MENU 』',
  ];
  const sorted = [...commandNames].sort();
  for (const name of sorted) {
    lines.push(`│ ⟢ \`\`\`.${name}\`\`\``);
  }
  lines.push('╰──────────────────');
  lines.push('');
  lines.push('Catatan: Tag teman contoh ```.cekfemboy @teman``` atau tanpa tag untuk memilih target otomatis.');
  lines.push('> 「Gunakan untuk hiburan semata di dalam grup.」');
  return lines.join('\n');
}

const funMessages = {
  defaultResponses,
  personalResponses,
  pairResponses,
  jodohResponses,
  hargaDiriQuotes,
  formatPersonalBox,
  formatPairBox,
  buildFunMenu,
};

module.exports = { funMessages };
