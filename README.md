# Paste Rapi v0.3.2 (Fuck Edunex)

![Ikon Paste Rapi](icons/icon128.png)

Ekstensi Chrome Manifest V3 untuk memasukkan teks satu karakter demi satu ke kolom pilihan pengguna. Ini implementasi sendiri, bukan salinan kode atau merek Paste Anyway.

## Memasang atau memperbarui

1. [Unduh ZIP versi terbaru](https://github.com/ahmadnasrulrozak-gif/paste-rapi/archive/refs/heads/main.zip), atau buka repositori GitHub lalu pilih **Code → Download ZIP**.
2. Ekstrak ZIP ke folder tetap di PC Anda, misalnya `Documents/paste-rapi`. Jangan memuat ekstensi langsung dari dalam ZIP.
3. Buka `chrome://extensions` dan aktifkan **Developer mode**.
4. Pilih **Load unpacked**, lalu pilih folder hasil ekstrak yang berisi `manifest.json` (biasanya `paste-rapi-main`).
5. Sematkan ikon Paste Rapi di toolbar. Simpan folder tersebut di lokasinya agar ekstensi dapat terus dimuat Chrome.
6. Untuk memperbarui: unduh ulang ZIP, ganti berkas di folder instalasi yang sama, klik **Reload** pada kartu ekstensi, lalu muat ulang tab tujuan. Jika folder instalasi berubah, muat kembali melalui **Load unpacked**.

Ulangi langkah ini di setiap PC yang ingin dipakai. Pemasangan melalui **Load unpacked** dilakukan secara manual pada setiap browser.

## Memakai

1. Klik kolom tujuan pada halaman web hingga kursor muncul.
2. Klik ikon Paste Rapi.
3. Tempel teks ke **Teks Anda**, atau klik **Ambil clipboard**.
4. Kecepatan bawaan adalah **Hampir instan** (slider paling kiri / 0 ms): tanpa jeda sengaja antarhuruf. Karakter tetap dimasukkan satu per satu, dalam kelompok kecil agar halaman dan tombol berhenti tetap responsif. Waktu selesai bergantung pada panjang teks dan kecepatan editor. Geser ke kanan jika ingin lebih lambat. Opsi perapian awalnya mati; aktifkan opsi yang diinginkan dan periksa pratinjau.
5. Klik **Mulai mengetik**. Popup menutup dan teks dimasukkan bertahap, dimulai di posisi kursor atau menggantikan teks yang diseleksi.
6. Tekan **Esc** atau klik **Berhenti** pada panel halaman untuk menghentikan. Buka kembali popup untuk melihat progres atau menghentikan.

Pengetikan juga berhenti jika Anda mengetik, mengeklik halaman, berpindah kolom, atau menyembunyikan tab. Hasil yang sudah diketik tetap berada di kolom. Ekstensi tidak mengirim formulir secara otomatis.

Untuk mencoba, buka `demo.html` di browser. Pada pengaturan ekstensi aktifkan **Allow access to file URLs** agar ekstensi bisa mengakses halaman lokal ini.

## Format dan kompatibilitas

- Aktifkan **Rapikan teks → Hapus baris kosong** untuk mengubah dua atau lebih enter berturut-turut menjadi satu enter. Paragraf dan poin tetap terpisah tanpa baris kosong di antaranya; indentasi teks tetap terjaga. Pilihan ini disimpan dan hasilnya terlihat di pratinjau. Jika **Rapikan paragraf** ikut aktif, **Hapus baris kosong** tetap menghilangkan seluruh baris kosong di antara teks. Jarak yang berasal dari margin paragraf editor tujuan tidak diubah.
- Mendukung textarea, input teks standar, dan editor contenteditable yang menerima perintah penyisipan teks browser.
- Menjaga baris baru, indentasi, Unicode, dan emoji gabungan. Opsi perapian bisa mengubah format sesuai pilihan.
- Teks yang dimasukkan adalah teks biasa. Bold, font, tabel, dan tampilan paragraf mengikuti editor tujuan.
- Input satu baris menolak teks multibaris agar baris tidak hilang diam-diam.
- Editor khusus, iframe, canvas seperti sejumlah editor dokumen, halaman internal Chrome, Chrome Web Store, dan beberapa aplikasi mungkin tidak didukung.
- Karakter dimasukkan melalui operasi editor dan event input, bukan tombol fisik. Event buatan tidak memiliki `isTrusted: true`. Tidak ada jaminan akan dianggap sebagai pengetikan manusia atau lolos pendeteksian situs.

## Privasi

Tidak ada server, API AI, analitik, atau permintaan jaringan. Akses halaman diberikan sementara melalui `activeTab` ketika ekstensi dibuka. Clipboard hanya dibaca saat tombol ditekan. Draf disimpan dalam penyimpanan sesi ekstensi sampai sesi browser berakhir; tombol **Kosongkan** menghapusnya. Preferensi disimpan lokal.

Referensi API: https://developer.chrome.com/docs/extensions/reference/api/scripting
